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

export async function getComparableQuotes(
  embedding: number[],
  excludeQuoteId: string
): Promise<ComparableStats> {
  const vectorStr = `[${embedding.join(",")}]`;

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
  const median = count % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
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
