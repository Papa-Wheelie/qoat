/**
 * Run once to enable pgvector extension and add embedding column to QuoteAnalysis.
 * Usage: npx tsx scripts/setup-pgvector.ts
 */
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

async function main() {
  console.log("Enabling pgvector extension...");
  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
  console.log("✓ pgvector extension enabled");

  console.log("Adding embedding column to QuoteAnalysis...");
  await prisma.$executeRaw`
    ALTER TABLE "QuoteAnalysis" ADD COLUMN IF NOT EXISTS embedding vector(1024)
  `;
  console.log("✓ embedding column added");

  console.log("Creating HNSW index for fast similarity search...");
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "QuoteAnalysis_embedding_hnsw_idx"
    ON "QuoteAnalysis" USING hnsw (embedding vector_cosine_ops)
  `;
  console.log("✓ HNSW index created");

  console.log("\nSetup complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
