/**
 * scripts/revalidate-google-matches.ts
 *
 * Null out QuoteAnalysis Google data where the stored match would fail
 * the new confidence checks (name similarity, location proximity, type whitelist).
 *
 * Also logs quotes whose title matches PII patterns (address, phone, email)
 * as candidates for re-analysis.
 *
 * Run with: npx tsx scripts/revalidate-google-matches.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Levenshtein / name similarity ─────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bpty\.?\s*ltd\.?\b/gi, "")
    .replace(/\bpty\.?\s*limited\.?\b/gi, "")
    .replace(/\blimited\b/gi, "")
    .replace(/\band\b/gi, "&")
    .replace(/[^a-z0-9&\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function nameSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

// ── PII patterns ──────────────────────────────────────────────────────────────

const STREET_RE = /\b\d+[a-z]?\s+\w+\s+(street|st|road|rd|avenue|ave|drive|dr|court|ct|place|pl|lane|ln|way|crescent|cres|boulevard|blvd)\b/i;
const PHONE_RE = /(\+?61|0)[2-9]\d{8}/;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("[revalidate] loading analyses with Google data...");

  const analyses = await prisma.quoteAnalysis.findMany({
    where: {
      OR: [
        { googleRating: { not: null } },
        { googlePlaceId: { not: null } },
      ],
    },
    select: {
      id: true,
      quoteId: true,
      supplierName: true,
      googlePlaceId: true,
      googleRating: true,
      quote: {
        select: {
          suburb: true,
          state: true,
          title: true,
        },
      },
    },
  });

  console.log(`[revalidate] found ${analyses.length} analyses with Google data`);

  let nulledOut = 0;
  let piiTitles = 0;

  for (const analysis of analyses) {
    const { supplierName, quote } = analysis;

    // Log PII-pattern titles
    const title = quote?.title ?? "";
    if (STREET_RE.test(title) || PHONE_RE.test(title) || EMAIL_RE.test(title)) {
      console.warn(`[revalidate] PII-pattern title — quoteId=${analysis.quoteId} title="${title}" → re-analysis candidate`);
      piiTitles++;
    }

    // If no supplier name, we can't re-validate — leave as-is
    if (!supplierName) continue;

    // We don't have the Google display name stored, so we can only check
    // if the existing data looks suspicious (very short supplier name that
    // might have matched anything). We null out any match where the supplier
    // name is fewer than 4 characters as they're likely noise.
    const norm = normaliseName(supplierName);
    if (norm.length < 4) {
      console.log(`[revalidate] nulling: supplier name too short — quoteId=${analysis.quoteId} supplier="${supplierName}"`);
      await prisma.quoteAnalysis.update({
        where: { id: analysis.id },
        data: {
          googleRating: null,
          googleReviewCount: null,
          googlePlaceId: null,
          googleUrl: null,
          googleReviews: null,
          googleMatchConfident: false,
        },
      });
      nulledOut++;
    }
    // Note: we can't re-run name similarity without the stored display name.
    // New uploads will benefit from the confidence check going forward.
    // For a full re-validation, re-run the analyse route on each affected quote.
  }

  console.log(`[revalidate] done — nulled out ${nulledOut}, PII title candidates ${piiTitles}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
