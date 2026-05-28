import { z } from "zod";
import { anthropic } from "./claude";
import type { QuoteExtraction } from "./extractQuote";

const ComplianceFlagsSchema = z.object({
  permitLikelyRequired: z.boolean().catch(false),
  permitMentionedInQuote: z.boolean().catch(false),
  permitResponsibility: z.enum(["supplier", "client", "unclear"]).nullable().catch(null),
  permitNote: z.string().catch(""),
  certificateRequired: z.boolean().catch(false),
  certificateType: z.string().nullable().catch(null),
  certificateMentionedInQuote: z.boolean().catch(false),
  certificateNote: z.string().catch(""),
});

export type ComplianceFlags = z.infer<typeof ComplianceFlagsSchema>;

const SYSTEM_PROMPT =
  "You are an expert in Australian building regulations, council permits, and trade compliance requirements. Always respond with valid JSON only, no markdown, no explanation.";

export async function assessCompliance(
  extraction: QuoteExtraction,
  location?: { suburb?: string | null; state?: string | null }
): Promise<ComplianceFlags> {
  const locationLine =
    location?.suburb || location?.state
      ? `Location: ${[location.suburb, location.state].filter(Boolean).join(", ")}\n`
      : "";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Assess Australian regulatory compliance for this quote.
${locationLine}
PERMITS: Based on the job type and scope, does this work typically require a council or building permit in Australia? Consider: structural work, extensions, decks over 1m, plumbing alterations, electrical rewiring, demolition, etc. Does the quote mention obtaining a permit, and does it say who is responsible (supplier or client)?

CERTIFICATES OF COMPLIANCE: For electrical, plumbing, or gas work, Australian law requires a certificate of compliance (e.g. Certificate of Electrical Safety in VIC, Compliance Certificate for plumbing). Does this job require one? Does the quote mention providing it?

Be measured — permit rules vary by council and specifics. Use language like "this type of work often requires" rather than absolute statements. The goal is to prompt the homeowner to confirm, not to give legal certainty.

Quote data: ${JSON.stringify(extraction, null, 2)}

Return JSON:
{
  "permitLikelyRequired": boolean,
  "permitMentionedInQuote": boolean,
  "permitResponsibility": "supplier" | "client" | "unclear" | null,
  "permitNote": string (1 sentence, plain English, measured tone),
  "certificateRequired": boolean,
  "certificateType": string or null (e.g. "Certificate of Electrical Safety", "Plumbing Compliance Certificate"),
  "certificateMentionedInQuote": boolean,
  "certificateNote": string (1 sentence, plain English, measured tone)
}`,
      },
    ],
  });

  const firstBlock = message.content[0];
  if (firstBlock.type !== "text") throw new Error("Unexpected response type from Claude");

  const rawText = firstBlock.text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  return ComplianceFlagsSchema.parse(JSON.parse(rawText));
}
