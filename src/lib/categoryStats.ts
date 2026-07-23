import { prisma } from "./prisma";
import { getSubcategoryBySlug, getTopCategoryBySlug } from "./categories";

export type PriceBucket = {
  label: string;
  min: number;
  max: number | null; // null = open-ended top
  count: number;
};

export type CategoryStats = {
  subSlug: string;
  topSlug: string;
  subName: string;
  topName: string;
  totalCount: number;
  realCount: number;   // isSeed=false
  seedCount: number;   // isSeed=true
  price: {
    median: number;
    min: number;
    max: number;
    mean: number;
  } | null;
  distribution: PriceBucket[];
  commonLineItems: {
    description: string;
    count: number;
    medianAmount: number;
  }[];
  lastUpdated: string | null; // ISO date of the most recent quote
  stateDistribution: {
    state: string;
    count: number;
    medianPrice: number | null; // null when fewer than 3 quotes with prices
  }[];
  qualityDistribution: {
    tier: "budget" | "mid" | "premium";
    count: number;
    percentage: number;
  }[];
  sizeDistribution: {
    band: "small" | "medium" | "large";
    count: number;
    percentage: number;
  }[] | null; // null for per-unit / fixed-job subs
  hasEnoughData: boolean; // true if totalCount >= 10
};

// Internal shape from the Prisma select below.
type QuoteRow = {
  createdAt: Date;
  isSeed: boolean;
  state: string | null;
  analysis: {
    totalAmount: number | null;
    lineItems: unknown;
    qualityTier: string | null;
    jobSize: unknown;
  } | null;
};

type LineItem = {
  description?: string;
  totalPrice?: number | null;
};

// ── Formatting ────────────────────────────────────────────────────────────────

function formatBucketAUD(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return "$" + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "m";
  }
  if (n >= 1000) {
    const v = n / 1000;
    return "$" + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "k";
  }
  return "$" + n;
}

// ── Median helper ─────────────────────────────────────────────────────────────

function computeMedian(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// ── Price distribution ────────────────────────────────────────────────────────

function buildDistribution(amounts: number[], median: number): PriceBucket[] {
  if (amounts.length === 0) return [];

  const scale = median || 0;
  let bucketWidth: number;
  if (scale < 1000) bucketWidth = 250;
  else if (scale < 10000) bucketWidth = 2500;
  else if (scale < 50000) bucketWidth = 10000;
  else if (scale < 200000) bucketWidth = 50000;
  else bucketWidth = 100000;

  // 7 buckets: 6 fixed-width + 1 open-ended top
  const buckets: PriceBucket[] = [];
  for (let i = 0; i < 7; i++) {
    const min = i * bucketWidth;
    const max = i < 6 ? (i + 1) * bucketWidth : null;
    const label =
      max !== null
        ? formatBucketAUD(min) + "–" + formatBucketAUD(max)
        : formatBucketAUD(min) + "+";
    buckets.push({ label, min, max, count: 0 });
  }

  for (const amount of amounts) {
    const idx = Math.min(Math.floor(amount / bucketWidth), 6);
    buckets[idx].count++;
  }

  return buckets;
}

// ── Common line items ─────────────────────────────────────────────────────────

function buildCommonLineItems(
  quotes: QuoteRow[]
): CategoryStats["commonLineItems"] {
  const map = new Map<
    string,
    { originalDesc: string; count: number; amounts: number[] }
  >();

  for (const q of quotes) {
    if (!q.analysis?.lineItems) continue;
    const items = q.analysis.lineItems as LineItem[];
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      if (!item.description) continue;
      const key = item.description.trim().toLowerCase();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          originalDesc: item.description.trim(),
          count: 1,
          amounts: item.totalPrice != null ? [item.totalPrice] : [],
        });
      } else {
        existing.count++;
        if (item.totalPrice != null) existing.amounts.push(item.totalPrice);
      }
    }
  }

  const results: CategoryStats["commonLineItems"] = [];
  for (const data of map.values()) {
    if (data.count < 3) continue;
    const sorted = [...data.amounts].sort((a, b) => a - b);
    results.push({
      description: data.originalDesc,
      count: data.count,
      medianAmount: computeMedian(sorted),
    });
  }

  return results.sort((a, b) => b.count - a.count).slice(0, 10);
}

// ── State distribution ────────────────────────────────────────────────────────

function buildStateDistribution(
  quotes: QuoteRow[]
): CategoryStats["stateDistribution"] {
  const map = new Map<string, { count: number; amounts: number[] }>();
  for (const q of quotes) {
    if (!q.state) continue;
    const entry = map.get(q.state) ?? { count: 0, amounts: [] };
    entry.count++;
    if (q.analysis?.totalAmount != null) entry.amounts.push(q.analysis.totalAmount);
    map.set(q.state, entry);
  }
  return Array.from(map.entries())
    .map(([state, { count, amounts }]) => {
      const sorted = [...amounts].sort((a, b) => a - b);
      const medianPrice = sorted.length >= 3 ? computeMedian(sorted) : null;
      return { state, count, medianPrice };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

// ── Quality distribution ──────────────────────────────────────────────────────

function buildQualityDistribution(
  quotes: QuoteRow[]
): CategoryStats["qualityDistribution"] {
  const counts = { budget: 0, mid: 0, premium: 0 };
  let total = 0;
  for (const q of quotes) {
    const tier = q.analysis?.qualityTier;
    if (tier === "budget" || tier === "mid" || tier === "premium") {
      counts[tier]++;
      total++;
    }
  }
  return (["budget", "mid", "premium"] as const).map((tier) => ({
    tier,
    count: counts[tier],
    percentage: total > 0 ? Math.round((counts[tier] / total) * 100) : 0,
  }));
}

// ── Size distribution ─────────────────────────────────────────────────────────

function buildSizeDistribution(
  quotes: QuoteRow[]
): NonNullable<CategoryStats["sizeDistribution"]> {
  const counts = { small: 0, medium: 0, large: 0 };
  let total = 0;
  for (const q of quotes) {
    const jobSize = q.analysis?.jobSize as { sizeBand?: string } | null;
    const band = jobSize?.sizeBand;
    if (band === "small" || band === "medium" || band === "large") {
      counts[band]++;
      total++;
    }
  }
  return (["small", "medium", "large"] as const).map((band) => ({
    band,
    count: counts[band],
    percentage: total > 0 ? Math.round((counts[band] / total) * 100) : 0,
  }));
}

// ── Top category stats ────────────────────────────────────────────────────────

export type TopCategoryStats = {
  topSlug: string;
  topName: string;
  subSummaries: {
    subSlug: string;
    subName: string;
    totalCount: number;
    priceMedian: number | null;
    priceMin: number | null;
    priceMax: number | null;
    hasEnoughData: boolean;
  }[];
  totalCount: number;
};

export async function getTopCategoryStats(
  topSlug: string
): Promise<TopCategoryStats | null> {
  // Look up DB top category with its subcategories
  const dbTop = await prisma.topCategory.findUnique({
    where: { slug: topSlug },
    include: { subcategories: true },
  });
  if (!dbTop) return null;

  // Static config gives us the canonical sub order
  const catInfo = getTopCategoryBySlug(topSlug);
  if (!catInfo) return null;

  // One query for all quotes across all subs in this top category
  const subIds = dbTop.subcategories.map((s) => s.id);
  const allQuotes = await prisma.quote.findMany({
    where: { subcategoryId: { in: subIds }, hidden: false },
    select: {
      subcategoryId: true,
      analysis: { select: { totalAmount: true } },
    },
  });

  // Group by subcategoryId
  const quotesBySubId = new Map<string, (number | null)[]>();
  for (const q of allQuotes) {
    if (!q.subcategoryId) continue;
    const amounts = quotesBySubId.get(q.subcategoryId) ?? [];
    amounts.push(q.analysis?.totalAmount ?? null);
    quotesBySubId.set(q.subcategoryId, amounts);
  }

  // Build summaries in static order
  const subSummaries = catInfo.subcategories
    .map((staticSub) => {
      const dbSub = dbTop.subcategories.find((s) => s.slug === staticSub.slug);
      if (!dbSub) return null;

      const rawAmounts = quotesBySubId.get(dbSub.id) ?? [];
      const totalCount = rawAmounts.length;
      const amounts = rawAmounts.filter((a): a is number => a != null);

      let priceMedian: number | null = null;
      let priceMin: number | null = null;
      let priceMax: number | null = null;

      if (amounts.length > 0) {
        const sorted = [...amounts].sort((a, b) => a - b);
        priceMedian = computeMedian(sorted);
        priceMin = sorted[0];
        priceMax = sorted[sorted.length - 1];
      }

      return {
        subSlug: staticSub.slug,
        subName: staticSub.name,
        totalCount,
        priceMedian,
        priceMin,
        priceMax,
        hasEnoughData: totalCount >= 10,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const totalCount = subSummaries.reduce((acc, s) => acc + s.totalCount, 0);

  return {
    topSlug,
    topName: dbTop.name,
    subSummaries,
    totalCount,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getCategoryStats(
  subSlug: string
): Promise<CategoryStats | null> {
  // Look up subcategory in DB (includes topCategory for names + slugs)
  const dbSub = await prisma.subcategory.findUnique({
    where: { slug: subSlug },
    include: { topCategory: true },
  });
  if (!dbSub) return null;

  // Pricing model comes from the static categories config
  const catInfo = getSubcategoryBySlug(subSlug);
  const pricingModel = catInfo?.sub.pricingModel ?? null;

  // Fetch all non-hidden quotes for this sub-category
  const quotes = await prisma.quote.findMany({
    where: {
      subcategoryId: dbSub.id,
      hidden: false,
    },
    select: {
      createdAt: true,
      isSeed: true,
      state: true,
      analysis: {
        select: {
          totalAmount: true,
          lineItems: true,
          qualityTier: true,
          jobSize: true,
        },
      },
    },
  });

  const totalCount = quotes.length;
  const realCount = quotes.filter((q) => !q.isSeed).length;
  const seedCount = quotes.filter((q) => q.isSeed).length;

  const lastUpdated =
    quotes.length > 0
      ? new Date(Math.max(...quotes.map((q) => q.createdAt.getTime()))).toISOString()
      : null;

  // Price stats
  const amounts = quotes
    .map((q) => q.analysis?.totalAmount)
    .filter((a): a is number => a != null);

  let price: CategoryStats["price"] = null;
  let median = 0;

  if (amounts.length > 0) {
    const sorted = [...amounts].sort((a, b) => a - b);
    median = computeMedian(sorted);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    price = {
      median,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / sorted.length,
    };
  }

  return {
    subSlug,
    topSlug: dbSub.topCategory.slug,
    subName: dbSub.name,
    topName: dbSub.topCategory.name,
    totalCount,
    realCount,
    seedCount,
    lastUpdated,
    price,
    distribution: buildDistribution(amounts, median),
    commonLineItems: buildCommonLineItems(quotes),
    stateDistribution: buildStateDistribution(quotes),
    qualityDistribution: buildQualityDistribution(quotes),
    sizeDistribution:
      pricingModel === "scope-variant" ? buildSizeDistribution(quotes) : null,
    hasEnoughData: totalCount >= 10,
  };
}
