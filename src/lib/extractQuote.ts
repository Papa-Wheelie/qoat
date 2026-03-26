import { z } from "zod";
import { anthropic } from "./claude";
import { supabase } from "./supabase";

const LineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().nullable().optional(),
  unitPrice: z.number().nullable().optional(),
  totalPrice: z.number().nullable().optional(),
});

const ExtractionSchema = z.object({
  supplierName: z.string().nullable(),
  quoteDate: z.string().nullable(),
  quoteNumber: z.string().nullable(),
  totalAmount: z.number().nullable(),
  currency: z.literal("AUD"),
  lineItems: z.array(LineItemSchema),
  paymentTerms: z.string().nullable(),
  validUntil: z.string().nullable(),
  estimatedTimeframe: z.string().nullable(),
  tradeCategory: z.string().nullable(),
  redFlags: z.array(z.string()),
  questionsToAsk: z.array(z.string()),
  summary: z.string(),
  publicSummary: z.string(),
});

export type QuoteExtraction = z.infer<typeof ExtractionSchema>;

const SYSTEM_PROMPT =
  "You are an expert at reading Australian trade and supplier quotes. All dates are in Australian format DD/MM/YYYY. 11/2/2026 means 11 February 2026. Today's date is in 2026. Only flag a quote as future dated if the date is after today when correctly parsed as DD/MM/YYYY. Never flag a past or current date as future dated. Extract structured data from the quote document provided. Always respond with valid JSON only, no markdown, no explanation. When generating the publicSummary, never mention the supplier name, business name, or any identifying details. Describe only the scope of work.";

const USER_PROMPT = `Extract the following from this quote document and return as JSON:

Important: This is an Australian quote. All dates are in Australian format DD/MM/YYYY. For example 11/2/2026 means 11 February 2026, not November 2nd. When identifying red flags do not flag future dated quotes unless the date is genuinely in the future when interpreted as DD/MM/YYYY.

{
  "supplierName": string or null,
  "quoteDate": string or null,
  "quoteNumber": string or null,
  "totalAmount": number or null,
  "currency": "AUD" always,
  "lineItems": [{ "description": string, "quantity": number or null, "unitPrice": number or null, "totalPrice": number or null }],
  "paymentTerms": string or null,
  "validUntil": string or null,
  "estimatedTimeframe": string or null,
  "tradeCategory": string or null,
  "redFlags": [string] — list any genuinely concerning items such as missing scope, unusual payment terms, exclusions that could surprise the client, or vague timeframes. Do NOT flag the quote date as future dated unless you are certain the date is in the future when read in DD/MM/YYYY Australian format.,
  "questionsToAsk": [string] — 3 to 5 specific, practical questions the homeowner should ask this supplier before accepting the quote. Base these on gaps, vague items, or red flags found in the quote. Make them conversational and easy for a non-expert to ask. Example: "Can you provide a written timeframe for completion?",
  "summary": string one sentence plain English summary (may include supplier name and price context),
  "publicSummary": string one sentence describing only the job type and scope of work — no supplier name, no price, no opinions. Example: "Supply and installation of 3 skylights with custom flashing and internal finishing."
}`;

export async function extractQuote(
  storagePath: string,
  fileType: string
): Promise<QuoteExtraction> {
  // Generate a 60-second signed URL so the file is accessible regardless of bucket visibility
  console.log("[extractQuote] generating signed URL for", storagePath);
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("quotes")
    .createSignedUrl(storagePath, 60);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${signedUrlError?.message}`);
  }
  console.log("[extractQuote] signed URL generated, downloading file...");

  const res = await fetch(signedUrlData.signedUrl);
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const base64 = buffer.toString("base64");
  console.log("[extractQuote] file downloaded, size:", buffer.byteLength, "bytes, sending to Claude...");

  type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  const isPdf = fileType === "application/pdf";

  const fileBlock = isPdf
    ? ({
        type: "document" as const,
        source: {
          type: "base64" as const,
          media_type: "application/pdf" as const,
          data: base64,
        },
      })
    : ({
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: fileType as ImageMediaType,
          data: base64,
        },
      });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [fileBlock, { type: "text", text: USER_PROMPT }],
      },
    ],
  });
  console.log("[extractQuote] Claude responded, stop_reason:", message.stop_reason);

  const firstBlock = message.content[0];
  if (firstBlock.type !== "text") throw new Error("Unexpected response type from Claude");

  console.log("[extractQuote] raw response:", firstBlock.text.slice(0, 200));
  const rawText = firstBlock.text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(rawText);
  const result = ExtractionSchema.parse(parsed);
  console.log("[extractQuote] validation passed, summary:", result.summary);
  return result;
}
