/**
 * scripts/migrate-legacy-categories.ts
 *
 * One-off AI categorisation for legacy quotes (those without subcategoryId set).
 * Uses Claude to infer top + sub category from the original document.
 * Only updates subcategoryId — does not touch scores, embeddings, or compliance.
 * IDEMPOTENT: re-running only processes quotes still missing subcategoryId.
 *
 * Run with:  npx tsx scripts/migrate-legacy-categories.ts
 * Requires:  DATABASE_URL, ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
 *            SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { PrismaClient } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import * as dotenv from "dotenv";
import * as path from "path";

// These modules export plain constants/functions — safe to import before dotenv
import { CATEGORIES, getAllTopCategorySlugs, getSubcategoryBySlug } from "../src/lib/categories";
import { MODEL_VERSION } from "../src/lib/methodology";

// Load .env.local before creating any clients
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ── Env guards ────────────────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set. Check .env.local.");
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY is not set. Check .env.local.");
  process.exit(1);
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. Check .env.local.");
  process.exit(1);
}

// ── Clients ───────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Types ─────────────────────────────────────────────────────────────────────

type QuoteRow = {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
};

type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

// ── Zod schema for Claude's response ─────────────────────────────────────────

const CategoryResponseSchema = z.object({
  inferredTopCategorySlug: z.string(),
  inferredSubcategorySlug: z.string().nullable(),
});

// ── Category list helper (mirrors extractQuote.ts buildCategorySection) ───────

function buildCategorySection(): string {
  const topList = CATEGORIES.map((c) => `  - ${c.slug} (${c.name})`).join("\n");
  const subList = CATEGORIES.map((c) => {
    const subs = c.subcategories.map((s) => `    - ${s.slug} (${s.name})`).join("\n");
    return `  ${c.slug}:\n${subs}`;
  }).join("\n");
  return `\n\nTOP CATEGORIES — choose exactly one slug:\n${topList}\n\nSUB-CATEGORIES — choose at most one slug (must be a child of your chosen top), or null:\n${subList}`;
}

// ── Storage path extraction (same as DELETE handler in quote route) ───────────

function storagePathFromUrl(fileUrl: string): string | null {
  const basePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/quotes/`;
  if (fileUrl.startsWith(basePrefix)) {
    return fileUrl.slice(basePrefix.length);
  }
  return null;
}

// ── Per-quote categorisation ──────────────────────────────────────────────────

async function inferCategory(
  quote: QuoteRow
): Promise<{ topSlug: string; subSlug: string | null } | null> {
  // 1. Resolve storage path
  const storagePath = storagePathFromUrl(quote.fileUrl);
  if (!storagePath) {
    console.warn("  ⚠ Could not parse storage path from fileUrl:", quote.fileUrl);
    return null;
  }

  // 2. Generate a short-lived signed URL and download the file
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("quotes")
    .createSignedUrl(storagePath, 60);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    console.warn("  ⚠ Signed URL error:", signedUrlError?.message);
    return null;
  }

  const fileRes = await fetch(signedUrlData.signedUrl);
  if (!fileRes.ok) {
    console.warn(`  ⚠ File fetch failed: ${fileRes.status} ${fileRes.statusText}`);
    return null;
  }

  const buffer = Buffer.from(await fileRes.arrayBuffer());
  const base64 = buffer.toString("base64");

  // 3. Build the Claude message
  const isPdf = quote.fileType === "application/pdf";

  type FileBlock =
    | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
    | { type: "image"; source: { type: "base64"; media_type: ImageMediaType; data: string } };

  const fileBlock: FileBlock = isPdf
    ? {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      }
    : {
        type: "image",
        source: { type: "base64", media_type: quote.fileType as ImageMediaType, data: base64 },
      };

  const categorySection = buildCategorySection();

  const userPrompt =
    `Identify the best matching category for this trade or supplier quote.\n\n` +
    `Reply ONLY with valid JSON in this exact shape:\n` +
    `{\n` +
    `  "inferredTopCategorySlug": "string — one slug from TOP CATEGORIES",\n` +
    `  "inferredSubcategorySlug": "string or null — one slug from SUB-CATEGORIES, or null"\n` +
    `}` +
    categorySection;

  const message = await anthropic.messages.create({
    model: MODEL_VERSION,
    max_tokens: 256,
    system:
      "You will be shown a trade or supplier quote document. Identify the best matching top-level category and sub-category from the lists below. Reply ONLY with valid JSON matching the schema. Do not include explanations or markdown.",
    messages: [
      {
        role: "user",
        content: [fileBlock, { type: "text", text: userPrompt }],
      },
    ],
  });

  // 4. Parse and validate Claude's response
  const firstBlock = message.content[0];
  if (firstBlock.type !== "text") {
    console.warn("  ⚠ Unexpected Claude response type:", firstBlock.type);
    return null;
  }

  const rawText = firstBlock.text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    console.warn("  ⚠ Claude returned invalid JSON:", rawText.slice(0, 120));
    return null;
  }

  const result = CategoryResponseSchema.safeParse(parsed);
  if (!result.success) {
    console.warn("  ⚠ Claude response failed schema validation:", result.error.message);
    return null;
  }

  // 5. Validate slugs against the taxonomy
  const allTopSlugs = getAllTopCategorySlugs();
  const topSlug = result.data.inferredTopCategorySlug;

  if (!allTopSlugs.includes(topSlug)) {
    console.warn(`  ⚠ Unknown top slug: "${topSlug}"`);
    return null;
  }

  let subSlug: string | null = result.data.inferredSubcategorySlug;
  if (subSlug !== null) {
    const match = getSubcategoryBySlug(subSlug);
    if (!match || match.top.slug !== topSlug) {
      console.warn(`  ⚠ Sub slug "${subSlug}" not valid under top "${topSlug}" — will set null`);
      subSlug = null;
    }
  }

  return { topSlug, subSlug };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const quotes = await prisma.quote.findMany({
    where: { subcategoryId: null },
    select: { id: true, title: true, fileUrl: true, fileType: true },
    orderBy: { createdAt: "asc" },
  });

  const total = quotes.length;
  console.log(`Found ${total} quote(s) without a subcategoryId.\n`);

  if (total === 0) {
    console.log("Nothing to migrate.");
    return;
  }

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < quotes.length; i++) {
    const quote = quotes[i];
    console.log(`[${i + 1}/${total}] Migrating ${quote.id} — ${quote.title}`);

    try {
      const inferred = await inferCategory(quote);

      if (!inferred) {
        console.log("  → skipped (invalid AI response or file error)");
        skipped++;
      } else {
        // Look up the Subcategory DB record by slug (if a sub was chosen)
        let subcategoryId: string | null = null;
        if (inferred.subSlug) {
          const sub = await prisma.subcategory.findUnique({
            where: { slug: inferred.subSlug },
            select: { id: true },
          });
          if (!sub) {
            console.warn(`  ⚠ Subcategory "${inferred.subSlug}" not found in DB — setting null`);
          } else {
            subcategoryId = sub.id;
          }
        }

        await prisma.quote.update({
          where: { id: quote.id },
          data: { subcategoryId },
        });

        console.log(
          `  → ${inferred.topSlug}${inferred.subSlug ? " / " + inferred.subSlug : " (no sub)"}`
        );
        migrated++;
      }
    } catch (err) {
      console.error("  → error:", err);
      errors++;
    }

    // Brief pause between quotes to stay within API rate limits
    if (i < quotes.length - 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`\nDone.`);
  console.log(`  ${migrated} migrated successfully`);
  console.log(`  ${skipped} skipped (invalid AI response or file issue)`);
  console.log(`  ${errors} errors`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
