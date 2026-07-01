import { z } from "zod";
import { anthropic } from "./claude";
import { supabase } from "./supabase";
import { MODEL_VERSION } from "./methodology";
import { CATEGORIES, getAllSubcategorySlugs, getAllTopCategorySlugs, getSubcategoryBySlug } from "@/lib/categories";

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
  abnNumber: z.string().nullable().catch(null),
  licenceNumber: z.string().nullable().catch(null),
  hasInsurance: z.boolean().catch(false),
  redFlags: z.array(z.string()),
  questionsToAsk: z.array(z.string()),
  summary: z.string(),
  publicSummary: z.string(),
  jobSize: z.object({
    quantity: z.number().nullable(),
    unit: z.string().nullable(),
    descriptor: z.string(),
    sizeBand: z.enum(["small", "medium", "large"]),
  }).catch({ quantity: null, unit: null, descriptor: "unspecified", sizeBand: "medium" }),
  inferredTitle: z.string().catch("New quote"),
  inferredCategorySlug: z.string().catch("other"),
  inferredTopCategorySlug: z.string().catch("supplies-products"),
  inferredSubcategorySlug: z.string().nullable().catch(null),
  qualityTier: z.enum(["budget", "mid", "premium"]).catch("mid"),
  suburb: z.string().nullable().catch(null),
  state: z.string().nullable().catch(null),
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
  "abnNumber": string or null — Australian Business Number exactly as printed (11 digits, may appear formatted as XX XXX XXX XXX),
  "licenceNumber": string or null — any trade or contractor licence number found in the document,
  "hasInsurance": boolean — true if public liability, professional indemnity, or any form of insurance is mentioned,
  "redFlags": [string] — list any genuinely concerning items such as missing scope, unusual payment terms, exclusions that could surprise the client, or vague timeframes. Do NOT flag the quote date as future dated unless you are certain the date is in the future when read in DD/MM/YYYY Australian format.,
  "questionsToAsk": [string] — 3 to 5 specific, practical questions the homeowner should ask this supplier before accepting the quote. Base these on gaps, vague items, or red flags found in the quote. Make them conversational and easy for a non-expert to ask. Example: "Can you provide a written timeframe for completion?",
  "summary": string one sentence plain English summary (may include supplier name and price context),
  "publicSummary": string one sentence describing only the job type and scope of work — no supplier name, no price, no opinions. Example: "Supply and installation of 3 skylights with custom flashing and internal finishing.",
  "jobSize": {
    "quantity": number or null — a measurable quantity if present (e.g. 3 for "3 skylights", 45 for "45m²"),
    "unit": string or null — the unit for quantity (e.g. "skylights", "m²", "hours", "lineal metres"),
    "descriptor": string — human-readable size description (e.g. "3 skylights", "45m² of decking", "full kitchen renovation", "replace 2 taps"),
    "sizeBand": "small" | "medium" | "large" — estimate the overall scale: small = minor repairs/single items, medium = room-scale or multi-item, large = whole-home, structural, or major renovation
  }
  Guidance for jobSize: extract quantitative measures wherever possible (count, area, volume). Where the job is a scope without clear units (e.g. "renovate bathroom"), set quantity and unit to null and describe the scope in descriptor. Always provide descriptor and sizeBand.
  "inferredTitle": string — a short, descriptive title for this quote (5–7 words max) describing the scope of work, e.g. "3 Velux skylight installation", "Bathroom waterproofing and tiling", "Backyard landscaping and retaining wall". NEVER include the supplier name, business name, street address, suburb, postcode, or price in the title. The title must describe what is being done, not who is doing it or where.
  "inferredCategorySlug": string — MUST be exactly one of: electrical, plumbing, building-construction, hvac-heating, painting-decorating, landscaping, automotive, insurance, supplier-products, other
  "inferredTopCategorySlug": string — MUST be exactly one slug from the TOP CATEGORIES list at the bottom of this prompt,
  "inferredSubcategorySlug": string or null — pick one slug from the SUB-CATEGORIES list below only if you are confident it fits; the slug MUST be a child of your chosen top category; if unsure set null,
  "qualityTier": "budget" | "mid" | "premium" — assess overall quality level based on the quote's contents,
  "suburb": string or null — the suburb of the job location if mentioned anywhere in the document (Australian suburb name only, no street address or postcode),
  "state": string or null — the Australian state abbreviation of the job location if mentioned (one of: NSW, VIC, QLD, WA, SA, TAS, ACT, NT)
}

Quality tier guidance:
- "budget": basic materials, minimum scope, off-the-shelf fittings, entry-level brands, cost-conscious specs
- "mid": typical mid-range work, standard fittings, common brands, normal spec (most common — default here if unclear)
- "premium": high-end finishes, natural stone, imported tiles, designer fixtures, custom joinery, luxury brand names (e.g. Miele, Sub-Zero, imported tapware)
Signals for premium: luxury brand names, descriptors like "custom", "bespoke", "handcrafted", "imported", specific premium materials (Carrara marble, brass tapware, designer names).
Signals for budget: "basic", "standard", "value", affordable brand mentions, minimal scope descriptions.`;

function buildCategorySection(): string {
  const topList = CATEGORIES.map((c) => `  - ${c.slug} (${c.name})`).join("\n");
  const subList = CATEGORIES.map((c) => {
    const subs = c.subcategories.map((s) => `    - ${s.slug} (${s.name})`).join("\n");
    return `  ${c.slug}:\n${subs}`;
  }).join("\n");
  return `\n\nTOP CATEGORIES — choose exactly one slug for inferredTopCategorySlug:\n${topList}\n\nSUB-CATEGORIES — choose at most one slug for inferredSubcategorySlug (must be a child of your chosen top category, or null):\n${subList}`;
}

export async function extractQuote(
  storagePath: string,
  fileType: string,
  description?: string | null
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

  const categorySection = buildCategorySection();
  const basePrompt = USER_PROMPT + categorySection;
  const userPromptText = description?.trim()
    ? `User provided context: ${description.trim()}\n\n${basePrompt}`
    : basePrompt;

  const message = await anthropic.messages.create({
    model: MODEL_VERSION,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [fileBlock, { type: "text", text: userPromptText }],
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
  const rawResult = ExtractionSchema.parse(parsed);

  // Validate inferredTopCategorySlug — fall back to "supplies-products" if invalid
  const allTopSlugs = getAllTopCategorySlugs();
  const topSlug = allTopSlugs.includes(rawResult.inferredTopCategorySlug)
    ? rawResult.inferredTopCategorySlug
    : "supplies-products";

  // Validate inferredSubcategorySlug — must exist and belong to the chosen top
  let subSlug: string | null = rawResult.inferredSubcategorySlug;
  if (subSlug !== null) {
    const allSubSlugs = getAllSubcategorySlugs();
    const subMatch = getSubcategoryBySlug(subSlug);
    if (!allSubSlugs.includes(subSlug) || !subMatch || subMatch.top.slug !== topSlug) {
      subSlug = null;
    }
  }

  const result: QuoteExtraction = {
    ...rawResult,
    inferredTopCategorySlug: topSlug,
    inferredSubcategorySlug: subSlug,
  };

  console.log("[extractQuote] validation passed, summary:", result.summary);
  console.log("[extractQuote] top:", topSlug, "sub:", subSlug);
  return result;
}
