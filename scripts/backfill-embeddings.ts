/**
 * Backfills embeddings for all QuoteAnalysis records that don't have one yet.
 * Run once after deploying the pgvector upgrade or switching embedding providers.
 * Usage: npx tsx scripts/backfill-embeddings.ts
 *
 * Requires VOYAGE_API_KEY in .env.local
 */
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

type AnalysisRow = {
  id: string;
  quoteId: string;
  publicSummary: string | null;
  lineItems: unknown;
  categoryName: string;
};

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ model: "voyage-3", input: [text], input_type: "document" }),
  });
  if (!res.ok) throw new Error(`Voyage AI error ${res.status}: ${await res.text()}`);
  const json = await res.json() as { data: Array<{ embedding: number[] }> };
  return json.data[0].embedding;
}

function buildEmbeddingText(
  categoryName: string,
  publicSummary: string | null,
  lineItems: Array<{ description?: string | null }>
): string {
  const parts: string[] = [categoryName];
  if (publicSummary?.trim()) parts.push(publicSummary.trim());
  const itemDescriptions = lineItems
    .map((li) => li.description?.trim())
    .filter(Boolean);
  if (itemDescriptions.length > 0) {
    parts.push(`Line items: ${itemDescriptions.join(", ")}`);
  }
  return parts.join(". ");
}

async function main() {
  // Find all analyses without an embedding
  const rows = await prisma.$queryRaw<AnalysisRow[]>`
    SELECT qa.id, qa."quoteId", qa."publicSummary", qa."lineItems", c.name AS "categoryName"
    FROM "QuoteAnalysis" qa
    JOIN "Quote" q ON q.id = qa."quoteId"
    JOIN "Category" c ON c.id = q."categoryId"
    WHERE qa.embedding IS NULL
    ORDER BY qa."createdAt" ASC
  `;

  console.log(`Found ${rows.length} analyses without embeddings.`);
  if (rows.length === 0) {
    console.log("Nothing to backfill.");
    return;
  }

  let success = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const lineItems = Array.isArray(row.lineItems) ? row.lineItems as Array<{ description?: string | null }> : [];
      const text = buildEmbeddingText(row.categoryName, row.publicSummary, lineItems);

      const embedding = await generateEmbedding(text);
      const vectorStr = `[${embedding.join(",")}]`;

      await prisma.$executeRawUnsafe(
        `UPDATE "QuoteAnalysis" SET embedding = $1::vector WHERE id = $2`,
        vectorStr,
        row.id
      );

      success++;
      console.log(`[${success + failed}/${rows.length}] ✓ ${row.id} (${row.categoryName})`);

      // Brief pause to stay well within Voyage rate limits
      await new Promise((r) => setTimeout(r, 50));
    } catch (err) {
      failed++;
      console.error(`[${success + failed}/${rows.length}] ✗ ${row.id}:`, err);
    }
  }

  console.log(`\nDone. ${success} succeeded, ${failed} failed.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
