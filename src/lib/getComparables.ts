import { prisma } from "./prisma";

export type ComparableStats = {
  count: number;
  averageTotal: number | null;
  medianTotal: number | null;
  minTotal: number | null;
  maxTotal: number | null;
  sampleSize: number;
  avgSimilarity: number | null;
  comparableIds: string[];
};

type SimilarRow = {
  quoteId: string;
  totalAmount: number | string;
  similarity: number | string;
};

// Internal type used to drive the three-tier fallback logic.
type ComparableFilters = {
  subcategoryId: string | null;
  sizeBand: string | null;
  excludeQuoteId: string;
};

function computeStats(rows: SimilarRow[]): ComparableStats {
  const count = rows.length;
  if (count === 0) {
    return {
      count: 0,
      averageTotal: null,
      medianTotal: null,
      minTotal: null,
      maxTotal: null,
      sampleSize: 0,
      avgSimilarity: null,
      comparableIds: [],
    };
  }

  const amounts = rows.map((r) => Number(r.totalAmount));
  const similarities = rows.map((r) => Number(r.similarity));
  const comparableIds = rows.map((r) => r.quoteId);

  const sorted = [...amounts].sort((a, b) => a - b);
  const sum = amounts.reduce((acc, v) => acc + v, 0);
  const mid = Math.floor(count / 2);
  const median =
    count % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const avgSim = similarities.reduce((acc, v) => acc + v, 0) / count;

  return {
    count,
    averageTotal: sum / count,
    medianTotal: median,
    minTotal: sorted[0],
    maxTotal: sorted[count - 1],
    sampleSize: count,
    avgSimilarity: avgSim,
    comparableIds,
  };
}

export async function getComparableQuotes(
  embedding: number[],
  excludeQuoteId: string
): Promise<ComparableStats> {
  const vectorStr = `[${embedding.join(",")}]`;

  // Look up the source quote's subcategoryId and jobSize for structured filtering.
  // QuoteAnalysis may not exist yet (e.g. during initial upload), in which case
  // sizeBand will be null and we fall back to sub-only or embedding-only.
  const [sourceQuote, sourceAnalysis] = await Promise.all([
    prisma.quote.findUnique({
      where: { id: excludeQuoteId },
      select: { subcategoryId: true },
    }),
    prisma.quoteAnalysis.findUnique({
      where: { quoteId: excludeQuoteId },
      select: { jobSize: true },
    }),
  ]);

  const filters: ComparableFilters = {
    subcategoryId: sourceQuote?.subcategoryId ?? null,
    sizeBand:
      (sourceAnalysis?.jobSize as { sizeBand?: string } | null)?.sizeBand ??
      null,
    excludeQuoteId,
  };

  // ── Tier 1: exact structural match — same subcategory + same sizeBand ─────
  if (filters.subcategoryId && filters.sizeBand) {
    const rows = await prisma.$queryRawUnsafe<SimilarRow[]>(
      `SELECT qa."quoteId",
              qa."totalAmount",
              1 - (qa.embedding <=> $1::vector) AS similarity
       FROM "QuoteAnalysis" qa
       JOIN "Quote" q ON q.id = qa."quoteId"
       WHERE qa.embedding IS NOT NULL
         AND q.id != $2
         AND q.status != 'rejected'
         AND qa."totalAmount" IS NOT NULL
         AND (q."isSeed" = true OR q.hidden = false)
         AND q."subcategoryId" = $3
         AND qa."jobSize"->>'sizeBand' = $4
       ORDER BY similarity DESC
       LIMIT 10`,
      vectorStr,
      filters.excludeQuoteId,
      filters.subcategoryId,
      filters.sizeBand
    );

    if (rows.length >= 3) {
      console.log(`[comparables] Comparables: ${rows.length} exact matches (sub+size)`);
      return computeStats(rows);
    }
  }

  // ── Tier 2: subcategory only (size mismatch tolerated) ────────────────────
  if (filters.subcategoryId) {
    const rows = await prisma.$queryRawUnsafe<SimilarRow[]>(
      `SELECT qa."quoteId",
              qa."totalAmount",
              1 - (qa.embedding <=> $1::vector) AS similarity
       FROM "QuoteAnalysis" qa
       JOIN "Quote" q ON q.id = qa."quoteId"
       WHERE qa.embedding IS NOT NULL
         AND q.id != $2
         AND q.status != 'rejected'
         AND qa."totalAmount" IS NOT NULL
         AND (q."isSeed" = true OR q.hidden = false)
         AND q."subcategoryId" = $3
       ORDER BY similarity DESC
       LIMIT 10`,
      vectorStr,
      filters.excludeQuoteId,
      filters.subcategoryId
    );

    if (rows.length >= 3) {
      console.log(`[comparables] Comparables: ${rows.length} sub-only matches`);
      return computeStats(rows);
    }
  }

  // ── Tier 3: embedding similarity only (legacy behaviour) ─────────────────
  const rows = await prisma.$queryRawUnsafe<SimilarRow[]>(
    `SELECT qa."quoteId",
            qa."totalAmount",
            1 - (qa.embedding <=> $1::vector) AS similarity
     FROM "QuoteAnalysis" qa
     JOIN "Quote" q ON q.id = qa."quoteId"
     WHERE qa.embedding IS NOT NULL
       AND q.id != $2
       AND q.status != 'rejected'
       AND qa."totalAmount" IS NOT NULL
       AND (1 - (qa.embedding <=> $1::vector)) > 0.75
     ORDER BY similarity DESC
     LIMIT 20`,
    vectorStr,
    excludeQuoteId
  );

  console.log(`[comparables] Comparables: ${rows.length} embedding-only matches`);
  return computeStats(rows);
}
