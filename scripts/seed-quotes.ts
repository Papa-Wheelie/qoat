/**
 * scripts/seed-quotes.ts
 *
 * Generates realistic seed Quote + QuoteAnalysis records from reference prices.
 * Uses Claude to produce plausible titles, line items, summaries, and scores.
 * Does NOT upload real files — quotes use a placeholder fileUrl.
 * IDEMPOTENT: refuses to re-seed an existing batch unless --force is passed.
 *
 * Usage:
 *   npx tsx scripts/seed-quotes.ts [--count=20] [--dry-run] [--force] [--batch=v1-2026-07]
 *
 * Options:
 *   --count=N    Number of quotes to generate (default: 20)
 *   --dry-run    Print plan without writing to DB or calling Claude
 *   --force      Allow re-seeding even if batch ID already exists in DB
 *   --batch=ID   Override the default batch ID (default: v1-2026-07)
 *
 * Requires: DATABASE_URL, ANTHROPIC_API_KEY in .env.local
 */

import { PrismaClient } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import * as dotenv from "dotenv";

import { CATEGORIES } from "../src/lib/categories";
import { CURRENT_METHODOLOGY_VERSION, MODEL_VERSION } from "../src/lib/methodology";

// Load env before creating any clients
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ── Env guards ─────────────────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set. Check .env.local.");
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY is not set. Check .env.local.");
  process.exit(1);
}

// ── Clients ────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── CLI args ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const COUNT = parseInt(args.find((a) => a.startsWith("--count="))?.split("=")[1] ?? "20", 10);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");
const BATCH_ID = args.find((a) => a.startsWith("--batch="))?.split("=")[1] ?? "v1-2026-07";

// ── Reference data types ───────────────────────────────────────────────────────

type PriceBand = {
  median: number;
  min: number;
  max: number;
  scope?: string;
  confidence: string;
};

type ScopeVariantPricing = {
  pricingModel: "scope-variant";
  bands: { small: PriceBand; medium: PriceBand; large: PriceBand };
};

type PerUnitPricing = {
  pricingModel: "per-unit";
  unitLabel: string;
  rate: { median: number; min: number; max: number };
};

type FixedJobPricing = {
  pricingModel: "fixed-job";
  band: PriceBand;
};

type SubPricing = ScopeVariantPricing | PerUnitPricing | FixedJobPricing;

type RefData = {
  categories: Record<string, Record<string, SubPricing>>;
};

// Load reference data
const refDataPath = path.resolve(process.cwd(), "data/reference-prices.draft.json");
const refData = JSON.parse(fs.readFileSync(refDataPath, "utf-8")) as RefData;

// ── Weighted random helpers ────────────────────────────────────────────────────

function weightedPick<T>(items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [item, w] of items) {
    r -= w;
    if (r <= 0) return item;
  }
  return items[items.length - 1][0];
}

/** Triangle distribution — biased toward the median. Result rounded to nearest $10. */
function triangleDistribution(min: number, median: number, max: number): number {
  if (min >= max) return median;
  const u = Math.random();
  const fc = (median - min) / (max - min);
  let x: number;
  if (u < fc) {
    x = min + Math.sqrt(u * (max - min) * (median - min));
  } else {
    x = max - Math.sqrt((1 - u) * (max - min) * (max - median));
  }
  return Math.round(x / 10) * 10;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Location data ──────────────────────────────────────────────────────────────

const AU_STATES: ["VIC" | "NSW" | "QLD" | "WA" | "SA", number][] = [
  ["VIC", 35], ["NSW", 30], ["QLD", 20], ["WA", 10], ["SA", 5],
];

const SUBURBS_BY_STATE: Record<string, string[]> = {
  VIC: ["Richmond", "Fitzroy", "Collingwood", "Brunswick", "Northcote", "Prahran", "St Kilda", "South Yarra", "Hawthorn", "Camberwell", "Box Hill", "Glen Waverley", "Doncaster", "Frankston", "Geelong"],
  NSW: ["Newtown", "Surry Hills", "Glebe", "Marrickville", "Balmain", "Mosman", "Manly", "Bondi", "Parramatta", "Penrith", "Chatswood", "Hornsby", "Cronulla", "Liverpool", "Wollongong"],
  QLD: ["Fortitude Valley", "West End", "Paddington", "Ascot", "New Farm", "Woolloongabba", "Toowong", "Sunnybank", "Indooroopilly", "Capalaba", "Maroochydore", "Noosa", "Townsville", "Cairns", "Gold Coast"],
  WA:  ["Subiaco", "Fremantle", "Cottesloe", "Scarborough", "Joondalup", "Midland", "Rockingham", "Mandurah", "Armadale", "Victoria Park", "Maylands", "Inglewood", "Balcatta", "Osborne Park", "Bunbury"],
  SA:  ["Unley", "Norwood", "Glenelg", "Prospect", "Burnside", "Modbury", "Salisbury", "Mount Gambier", "Port Adelaide", "Henley Beach", "Adelaide", "Marion", "Tea Tree Gully", "Morphett Vale", "Victor Harbor"],
};

function pickLocation(): { suburb: string; state: string } {
  const state = weightedPick(AU_STATES);
  const suburbs = SUBURBS_BY_STATE[state];
  const suburb = suburbs[randInt(0, suburbs.length - 1)];
  return { suburb, state };
}

// ── Supplier name templates ────────────────────────────────────────────────────

const SUPPLIER_TEMPLATES: Record<string, string[]> = {
  "home-renovation":     ["{suburb} Renovations", "{suburb} Home Improvements", "Quality Renovations Co", "Premier Home Works", "Total Renovate"],
  "building-structural": ["Steel & Stone Constructions", "{suburb} Building Group", "Foundation First", "Total Build Solutions", "Apex Construction"],
  "trades":              ["{suburb} Electrical Services", "{suburb} Plumbing & Gas", "All Trades Group", "Reliable Trade Co", "Pro-Tech Services"],
  "outdoor-property":    ["{suburb} Landscapes", "Green Thumb Garden Services", "Outdoor Living Co", "Ace Garden & Lawn", "Nature's Best Landscaping"],
  "energy-systems":      ["SolarMax {state}", "GreenEnergy Solutions", "EcoHome Systems", "PowerUp Solar", "Clean Energy Co"],
  "supplies-products":   ["{suburb} Building Supplies", "Metro Materials", "TradeMax Supply Co", "BuildRight Supplies", "Premium Products AU"],
};

function generateSupplierName(topSlug: string, suburb: string, state: string): string {
  const templates = SUPPLIER_TEMPLATES[topSlug] ?? ["Trade Services Co"];
  const template = templates[randInt(0, templates.length - 1)];
  return template.replace("{suburb}", suburb).replace("{state}", state);
}

// ── Weights ────────────────────────────────────────────────────────────────────

const QUALITY_WEIGHTS: ["budget" | "mid" | "premium", number][] = [
  ["budget", 15], ["mid", 65], ["premium", 20],
];

const SIZE_WEIGHTS: ["small" | "medium" | "large", number][] = [
  ["small", 25], ["medium", 55], ["large", 20],
];

// Subcategories that are seeded more often (proportional to real-world frequency)
const COMMON_SUBS = new Set([
  "kitchen-renovation", "bathroom-renovation", "electrical", "plumbing",
  "hvac-heating", "painting-decorating", "tiling", "landscaping",
  "solar-install", "decking", "roofing", "flooring-materials",
]);

function buildSubWeights(): [string, number][] {
  const weights: [string, number][] = [];
  for (const top of CATEGORIES) {
    const topRefData = refData.categories[top.slug];
    if (!topRefData) continue;
    for (const sub of top.subcategories) {
      if (!topRefData[sub.slug]) continue;
      weights.push([sub.slug, COMMON_SUBS.has(sub.slug) ? 3 : 1]);
    }
  }
  return weights;
}

// ── Per-unit quantity ranges (keyed by sub slug) ───────────────────────────────

type QtyRange = { min: number; max: number; step: number };

const PER_UNIT_QTY: Record<string, QtyRange> = {
  "concrete-paving":            { min: 20,  max: 80,  step: 5  },
  "fencing":                    { min: 10,  max: 60,  step: 5  },
  "decking":                    { min: 15,  max: 60,  step: 5  },
  "driveway-pathways":          { min: 25,  max: 100, step: 5  },
  "painting-decorating":        { min: 30,  max: 150, step: 10 },
  "plastering":                 { min: 20,  max: 80,  step: 5  },
  "tiling":                     { min: 10,  max: 50,  step: 5  },
  "glazing":                    { min: 2,   max: 8,   step: 1  },
  "solar-install":              { min: 6,   max: 13,  step: 1  },
  "battery-storage":            { min: 10,  max: 30,  step: 5  },
  "insulation":                 { min: 50,  max: 200, step: 10 },
  "flooring-materials":         { min: 20,  max: 100, step: 10 },
  "timber-lumber":              { min: 50,  max: 300, step: 25 },
  "blinds-shutters":            { min: 3,   max: 12,  step: 1  },
  "curtains-soft-furnishings":  { min: 3,   max: 10,  step: 1  },
  "windows-doors":              { min: 2,   max: 10,  step: 1  },
  "paint-finishes":             { min: 20,  max: 100, step: 10 },
  "building-materials":         { min: 20,  max: 200, step: 10 },
  "lighting-fixtures":          { min: 5,   max: 20,  step: 1  },
};

function pickQty(subSlug: string): number {
  const range = PER_UNIT_QTY[subSlug] ?? { min: 1, max: 10, step: 1 };
  const raw = randInt(range.min, range.max);
  return Math.round(raw / range.step) * range.step || range.step;
}

// ── Price calculation ──────────────────────────────────────────────────────────

type PriceResult = {
  total: number;
  quantity: number | null;
  unit: string | null;
  sizeDescriptor: string;
};

function calculatePrice(
  subSlug: string,
  topSlug: string,
  qualityTier: "budget" | "mid" | "premium",
  sizeBand: "small" | "medium" | "large"
): PriceResult {
  const topRefData = refData.categories[topSlug];
  const subRefData = topRefData?.[subSlug] as SubPricing | undefined;

  if (!subRefData) {
    throw new Error(`No reference data for ${topSlug} > ${subSlug}`);
  }

  const qualityMult = qualityTier === "budget" ? 0.85 : qualityTier === "premium" ? 1.20 : 1.0;

  if ("bands" in subRefData) {
    // scope-variant
    const band = subRefData.bands[sizeBand];
    const raw = triangleDistribution(band.min, band.median, band.max);
    const total = Math.max(10, Math.round((raw * qualityMult) / 10) * 10);
    return {
      total,
      quantity: null,
      unit: null,
      sizeDescriptor: band.scope ?? sizeBand,
    };
  }

  if ("rate" in subRefData) {
    // per-unit
    const qty = pickQty(subSlug);
    const rate = triangleDistribution(subRefData.rate.min, subRefData.rate.median, subRefData.rate.max);
    const total = Math.max(10, Math.round((qty * rate * qualityMult) / 10) * 10);
    const unit = subRefData.unitLabel.replace("$/", "");
    return {
      total,
      quantity: qty,
      unit,
      sizeDescriptor: `${qty} ${unit}`,
    };
  }

  // fixed-job
  const band = subRefData.band;
  const raw = triangleDistribution(band.min, band.median, band.max);
  const total = Math.max(10, Math.round((raw * qualityMult) / 10) * 10);
  return {
    total,
    quantity: null,
    unit: null,
    sizeDescriptor: band.scope ? band.scope.split("(")[0].trim() : "standard job",
  };
}

// ── Verdict helpers ────────────────────────────────────────────────────────────

function verdictPrice(score: number): string {
  if (score >= 7) return "competitive";
  if (score >= 4) return "fair";
  return "high";
}

function verdictReputation(score: number): string {
  if (score >= 7) return "strong";
  if (score >= 4) return "adequate";
  return "limited";
}

function verdictTime(score: number): string {
  if (score >= 7) return "fast";
  if (score >= 4) return "typical";
  return "slow";
}

function deriveRecommendation(price: number, rep: number, time: number): string {
  const weighted = price * 0.4 + rep * 0.35 + time * 0.25;
  if (weighted >= 6.5) return "accept";
  if (weighted >= 4.0) return "review";
  return "reject";
}

// ── Retry helper ───────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes("timeout") ||
        msg.includes("Connection error") ||
        msg.includes("Server has closed") ||
        msg.includes("ECONNRESET") ||
        msg.includes("529") ||
        msg.includes("overloaded");

      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`  → attempt ${attempt} failed (${msg.slice(0, 60)}...), retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// ── Zod schema for Claude's content response ───────────────────────────────────

const ContentSchema = z.object({
  title: z.string(),
  publicSummary: z.string(),
  lineItems: z.array(z.object({
    description: z.string(),
    amount: z.number(),
  })).min(2).max(6),
  scores: z.object({
    price: z.number().int().min(1).max(10),
    reputation: z.number().int().min(1).max(10),
    time: z.number().int().min(1).max(10),
  }),
  redFlags: z.array(z.string()),
  questionsToAsk: z.array(z.string()),
});

type ContentResult = z.infer<typeof ContentSchema>;

// ── Claude content generation ──────────────────────────────────────────────────

async function generateContent(
  subSlug: string,
  topSlug: string,
  qualityTier: "budget" | "mid" | "premium",
  sizeBand: "small" | "medium" | "large",
  priceResult: PriceResult,
  suburb: string,
  state: string
): Promise<ContentResult> {
  const topCat = CATEGORIES.find((c) => c.slug === topSlug);
  const subCat = topCat?.subcategories.find((s) => s.slug === subSlug);

  const pricingNote =
    qualityTier === "budget"
      ? "lean/budget pricing — price score should be higher (7-9)"
      : qualityTier === "premium"
      ? "premium pricing — price score should be mid-range (4-6)"
      : "mid-range pricing — price score should be realistic (5-8)";

  const prompt = `Generate realistic seed data for an Australian trade/supplier quote. Return ONLY valid JSON, no markdown.

Category: ${topCat?.name ?? topSlug} > ${subCat?.name ?? subSlug}
Quality tier: ${qualityTier}
Job scope: ${priceResult.sizeDescriptor}
Total price: $${priceResult.total.toLocaleString()} AUD
Location: ${suburb}, ${state}

Return JSON in this exact shape (no extra fields, no markdown):
{
  "title": "...",
  "publicSummary": "...",
  "lineItems": [{ "description": "...", "amount": 0 }],
  "scores": { "price": 0, "reputation": 0, "time": 0 },
  "redFlags": [],
  "questionsToAsk": ["...", "...", "..."]
}

Rules:
- title: 5-7 words describing the job scope. No supplier name, no price, no suburb.
- publicSummary: one sentence describing scope only. No supplier name, no price.
- lineItems: 2 to 5 items. Amounts must sum to exactly $${priceResult.total}.
- scores: integers 1-10. Calibrate for ${pricingNote}. Vary reputation and time realistically.
- redFlags: 0-2 realistic issues for this trade type, or empty array [] for clean quotes.
- questionsToAsk: exactly 3 practical homeowner questions based on this scope.`;

  const message = await anthropic.messages.create({
    model: MODEL_VERSION,
    max_tokens: 650,
    temperature: 0.8,
    messages: [{ role: "user", content: prompt }],
  });

  const firstBlock = message.content[0];
  if (firstBlock.type !== "text") throw new Error("Unexpected Claude response type");

  const rawText = firstBlock.text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(rawText);

  // Ensure line items sum approximately to total (Claude may be off by rounding)
  const content = ContentSchema.parse(parsed);
  const lineItemSum = content.lineItems.reduce((s, li) => s + li.amount, 0);
  const diff = priceResult.total - lineItemSum;
  if (diff !== 0 && content.lineItems.length > 0) {
    content.lineItems[content.lineItems.length - 1].amount += diff;
  }

  return content;
}

// ── DB insertion ───────────────────────────────────────────────────────────────

async function insertQuote(
  subSlug: string,
  topSlug: string,
  qualityTier: "budget" | "mid" | "premium",
  sizeBand: "small" | "medium" | "large",
  priceResult: PriceResult,
  content: ContentResult,
  suburb: string,
  state: string,
  seedUserId: string,
  fallbackCategoryId: string,
  subcategoryId: string | null,
  index: number
): Promise<void> {
  const supplierName = generateSupplierName(topSlug, suburb, state);
  const { price: priceScore, reputation: repScore, time: timeScore } = content.scores;
  const rec = deriveRecommendation(priceScore, repScore, timeScore);

  const jobSize = {
    quantity: priceResult.quantity,
    unit: priceResult.unit,
    descriptor: priceResult.sizeDescriptor,
    sizeBand,
  };

  const lineItemsForAnalysis = content.lineItems.map((li) => ({
    description: li.description,
    quantity: null,
    unitPrice: null,
    totalPrice: li.amount,
  }));

  const rawExtraction = {
    supplierName,
    quoteDate: null,
    quoteNumber: null,
    totalAmount: priceResult.total,
    currency: "AUD",
    lineItems: lineItemsForAnalysis,
    paymentTerms: null,
    validUntil: null,
    estimatedTimeframe: null,
    tradeCategory: subSlug,
    abnNumber: null,
    licenceNumber: null,
    hasInsurance: false,
    redFlags: content.redFlags,
    questionsToAsk: content.questionsToAsk,
    summary: `${supplierName} quote — ${content.title} — $${priceResult.total.toLocaleString()} AUD`,
    publicSummary: content.publicSummary,
    jobSize,
    inferredTitle: content.title,
    inferredCategorySlug: "other",
    inferredTopCategorySlug: topSlug,
    inferredSubcategorySlug: subSlug,
    qualityTier,
    suburb,
    state,
  };

  const quote = await prisma.quote.create({
    data: {
      title: content.title,
      fileUrl: "seed://placeholder",
      fileName: "seed-quote.pdf",
      fileType: "application/pdf",
      userId: seedUserId,
      categoryId: fallbackCategoryId,
      subcategoryId,
      suburb,
      state,
      analysisStatus: "complete",
      welcomeAcknowledged: true,
      isSeed: true,
      seedBatch: BATCH_ID,
      seedNotes: `sub=${subSlug}; quality=${qualityTier}; size=${sizeBand}; total=${priceResult.total}`,
    },
  });

  await prisma.quoteAnalysis.create({
    data: {
      quoteId: quote.id,
      rawExtraction,
      supplierName,
      totalAmount: priceResult.total,
      lineItems: lineItemsForAnalysis,
      redFlags: content.redFlags,
      questionsToAsk: content.questionsToAsk,
      summary: rawExtraction.summary,
      publicSummary: content.publicSummary,
      qualityTier,
      jobSize,
      priceScore,
      priceVerdict: verdictPrice(priceScore),
      priceExplanation: `Price is ${verdictPrice(priceScore)} for a ${qualityTier}-quality ${(subSlug).replace(/-/g, " ")} job in ${suburb}, ${state}.`,
      reputationScore: repScore,
      reputationVerdict: verdictReputation(repScore),
      reputationExplanation: `Supplier reputation assessed as ${verdictReputation(repScore)} based on available signals.`,
      timeScore,
      timeVerdict: verdictTime(timeScore),
      timeExplanation: `Estimated timeframe is ${verdictTime(timeScore)} for this scope of work.`,
      recommendation: rec,
      overallSummary: `Seed quote #${index + 1}: ${content.title}. Overall recommendation: ${rec}.`,
      methodologyVersion: CURRENT_METHODOLOGY_VERSION,
      modelVersion: MODEL_VERSION,
      googleMatchConfident: false,
      priceComparableIds: [],
    },
  });
}

// ── Prompt helper ──────────────────────────────────────────────────────────────

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n=== QOAT Seed Script ===");
  console.log(`Batch:   ${BATCH_ID}`);
  console.log(`Count:   ${COUNT}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Force:   ${FORCE}\n`);

  // Idempotency guard
  if (!FORCE && !DRY_RUN) {
    const existing = await prisma.quote.count({ where: { seedBatch: BATCH_ID } });
    if (existing > 0) {
      console.error(`Batch "${BATCH_ID}" already has ${existing} quote(s) in the DB.`);
      console.error(`Use --force to allow re-seeding, or choose a different --batch= ID.`);
      process.exit(1);
    }
  }

  // Cost warning for large runs
  if (!DRY_RUN && COUNT > 20) {
    const ok = await confirm(`This will make ~${COUNT} Claude API calls. Continue? (y/N) `);
    if (!ok) {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  // Resolve seed user (upsert so re-runs are safe)
  let seedUserId = "dry-run-user-id";
  let fallbackCategoryId = "dry-run-category-id";

  if (!DRY_RUN) {
    const seedUser = await prisma.user.upsert({
      where: { email: "seed@qoat.internal" },
      create: { email: "seed@qoat.internal", name: "Seed Data" },
      update: {},
    });
    seedUserId = seedUser.id;

    const otherCat = await prisma.category.findFirst({ where: { slug: "other" } });
    if (!otherCat) {
      console.error('"other" category not found in DB. Run prisma db seed first.');
      process.exit(1);
    }
    fallbackCategoryId = otherCat.id;
  }

  // Build weighted subcategory pool
  const subWeights = buildSubWeights();
  if (subWeights.length === 0) {
    console.error("No subcategories found with reference price data.");
    process.exit(1);
  }
  console.log(`Subcategory pool: ${subWeights.length} options\n`);

  let generated = 0;
  let errors = 0;

  for (let i = 0; i < COUNT; i++) {
    const subSlug = weightedPick(subWeights);

    // Find parent top category slug
    let topSlug = "";
    for (const top of CATEGORIES) {
      if (top.subcategories.some((s) => s.slug === subSlug)) {
        topSlug = top.slug;
        break;
      }
    }

    const qualityTier = weightedPick(QUALITY_WEIGHTS);
    const sizeBand = weightedPick(SIZE_WEIGHTS);
    const { suburb, state } = pickLocation();

    let priceResult: PriceResult;
    try {
      priceResult = calculatePrice(subSlug, topSlug, qualityTier, sizeBand);
    } catch (err) {
      console.error(`[${i + 1}/${COUNT}] Price calc failed for ${subSlug}:`, err instanceof Error ? err.message : err);
      errors++;
      continue;
    }

    console.log(
      `[${i + 1}/${COUNT}] ${topSlug} > ${subSlug} | ${qualityTier} | ${sizeBand} | $${priceResult.total.toLocaleString()} | ${suburb}, ${state}`
    );

    if (DRY_RUN) {
      console.log(`  → dry-run: "${priceResult.sizeDescriptor}"`);
      generated++;
      continue;
    }

    try {
      const content = await withRetry(() =>
        generateContent(subSlug, topSlug, qualityTier, sizeBand, priceResult, suburb, state)
      );

      const subRecord = await prisma.subcategory.findUnique({
        where: { slug: subSlug },
        select: { id: true },
      });

      await withRetry(() =>
        insertQuote(
          subSlug, topSlug, qualityTier, sizeBand, priceResult, content,
          suburb, state, seedUserId, fallbackCategoryId, subRecord?.id ?? null, i
        )
      );

      const { price: p, reputation: r, time: t } = content.scores;
      console.log(`  → "${content.title}" | price=${p} rep=${r} time=${t} | rec=${deriveRecommendation(p, r, t)}`);
      generated++;
    } catch (err) {
      console.error(`  → error:`, err instanceof Error ? err.message : String(err));
      errors++;
    }

    if (i < COUNT - 1) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  console.log("\n=== Done ===");
  console.log(`  Generated: ${generated}`);
  console.log(`  Errors:    ${errors}`);
  if (DRY_RUN) console.log("  (dry run — nothing written to DB or Claude)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
