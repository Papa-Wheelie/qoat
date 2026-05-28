import { z } from "zod";
import { anthropic } from "./claude";
import type { QuoteExtraction } from "./extractQuote";
import type { ComparableStats } from "./getComparables";
import type { ReputationSignals } from "./getReputationSignals";

const ScoreSchema = z.object({
  price: z.object({
    score: z.number().int().min(1).max(10),
    verdict: z.enum(["fair", "high", "low"]),
    explanation: z.string(),
  }),
  reputation: z.object({
    score: z.number().int().min(1).max(10),
    verdict: z.enum(["trustworthy", "adequate", "concerning"]),
    explanation: z.string(),
  }),
  time: z.object({
    score: z.number().int().min(1).max(10),
    verdict: z.enum(["fast", "typical", "slow", "unspecified"]),
    explanation: z.string(),
  }),
  overall: z.object({
    recommendation: z.enum(["accept", "negotiate", "reject", "get-more-quotes"]),
    summary: z.string(),
  }),
});

export type QuoteScore = z.infer<typeof ScoreSchema>;

const SYSTEM_PROMPT =
  "You are an expert in the Australian trade and construction industry with deep knowledge of fair market pricing, quality workmanship standards, and typical project timeframes across all states. You help Australian consumers understand if they are getting a fair deal. Always respond with valid JSON only, no markdown, no explanation. Never mention the supplier name in any explanation or summary text.";

export async function scoreQuote(
  extraction: QuoteExtraction,
  location?: { suburb?: string | null; state?: string | null },
  description?: string | null,
  googleReviews?: { rating: number; reviewCount: number } | null,
  comparables?: ComparableStats | null,
  reputationSignals?: ReputationSignals | null
): Promise<QuoteScore> {
  const locationLine =
    location?.suburb || location?.state
      ? `Location: ${[location.suburb, location.state].filter(Boolean).join(", ")}`
      : null;

  const descriptionLine = description?.trim()
    ? `User provided context: ${description.trim()}`
    : null;

  const googleLine =
    googleReviews?.rating != null && googleReviews?.reviewCount != null
      ? `Google Reviews: ${googleReviews.rating}/5 stars from ${googleReviews.reviewCount.toLocaleString()} reviews`
      : null;

  const reputationLine = reputationSignals != null
    ? `Reputation signals for this supplier:
- Google: ${reputationSignals.googleRating != null ? `${reputationSignals.googleRating}/5 from ${reputationSignals.googleReviewCount?.toLocaleString()} reviews` : "not found"}
- ABN provided: ${reputationSignals.hasABN ? `yes (${reputationSignals.abnNumber})` : "no"}
- Licence number provided: ${reputationSignals.hasLicence ? `yes (${reputationSignals.licenceNumber})` : "no"} (licence required for this trade: ${reputationSignals.licenceRequired ? "yes" : "no"})
- Insurance mentioned: ${reputationSignals.hasInsurance ? "yes" : "no"}
- Seen in ${reputationSignals.qoatQuoteCount} other QOAT quote${reputationSignals.qoatQuoteCount !== 1 ? "s" : ""}

Score reputation 1-10. A licensed, insured supplier with an ABN and strong Google reviews scores high. Missing a legally-required licence is a major red flag. No Google presence for an established-seeming business is a concern.`
    : null;

  const categoryName = (extraction as { category?: string }).category ?? "trade";
  const stateName = location?.state ?? null;
  const communityLine =
    comparables != null && comparables.sampleSize >= 3
      ? `QOAT community data: Based on ${comparables.sampleSize} semantically similar jobs, the typical range is $${Math.round(comparables.minTotal!).toLocaleString()} to $${Math.round(comparables.maxTotal!).toLocaleString()}, averaging $${Math.round(comparables.averageTotal!).toLocaleString()}. These are real quotes for comparable work. Factor this into your price assessment alongside your general knowledge. Weight the community data more heavily when the sample size is large.`
      : null;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Based on this Australian trade quote, provide an iron triangle assessment. Score each dimension 1-10 where 10 is best.
${locationLine ? `\n${locationLine}\n` : ""}${descriptionLine ? `\n${descriptionLine}\n` : ""}${reputationLine ? `\n${reputationLine}\n` : googleLine ? `\n${googleLine}\n` : ""}${communityLine ? `\n${communityLine}\n` : ""}
Quote data: ${JSON.stringify(extraction, null, 2)}

Return JSON:
{
  "price": {
    "score": number 1-10,
    "verdict": "fair" | "high" | "low",
    "explanation": string (1-2 sentences, plain English, mention specific dollar amounts where relevant)
  },
  "reputation": {
    "score": number 1-10,
    "verdict": "trustworthy" | "adequate" | "concerning",
    "explanation": string (1-2 sentences — reference specific signals: ABN, licence, insurance, Google presence. Mention the most important factor driving the score.)
  },
  "time": {
    "score": number 1-10,
    "verdict": "fast" | "typical" | "slow" | "unspecified",
    "explanation": string (1-2 sentences, plain English)
  },
  "overall": {
    "recommendation": "accept" | "negotiate" | "reject" | "get-more-quotes",
    "summary": string (2-3 sentences, plain English advice to the homeowner)
  }
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

  const parsed = JSON.parse(rawText);
  return ScoreSchema.parse(parsed);
}
