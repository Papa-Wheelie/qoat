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
  summary: z.string(),
});

export type QuoteExtraction = z.infer<typeof ExtractionSchema>;

const SYSTEM_PROMPT =
  "You are an expert at reading Australian trade and supplier quotes. Extract structured data from the quote document provided. Always respond with valid JSON only, no markdown, no explanation.";

const USER_PROMPT = `Extract the following from this quote document and return as JSON:
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
  "redFlags": [string] any concerning items found,
  "summary": string one sentence plain English summary
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
