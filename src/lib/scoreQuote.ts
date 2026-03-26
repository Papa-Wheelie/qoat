import { z } from "zod";
import { anthropic } from "./claude";
import type { QuoteExtraction } from "./extractQuote";

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
  "You are an expert in the Australian trade and construction industry with deep knowledge of fair market pricing, quality workmanship standards, and typical project timeframes across all states. You help Australian consumers understand if they are getting a fair deal. Always respond with valid JSON only, no markdown, no explanation.";

export async function scoreQuote(extraction: QuoteExtraction): Promise<QuoteScore> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Based on this Australian trade quote, provide an iron triangle assessment. Score each dimension 1-10 where 10 is best.

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
    "explanation": string (1-2 sentences — assess based on: is ABN present, is licence number mentioned, is insurance referenced, are payment terms reasonable, does the business appear legitimate and professional)
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
