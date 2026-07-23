import { formatAUD } from "@/lib/formatPrice";
import type { CategoryStats } from "@/lib/categoryStats";
import type { SubcategoryContent } from "@/lib/subcategoryContent";
import { FALLBACK_PERMIT_NOTES } from "@/lib/subcategoryContent";

export type FaqItem = {
  question: string;
  answer: string;
};

export function generateCategoryFaqs(
  subName: string,
  stats: CategoryStats,
  content: SubcategoryContent
): FaqItem[] {
  const faqs: FaqItem[] = [];
  const subNameLower = subName.toLowerCase();

  // ── Q1: Cost ──────────────────────────────────────────────────────────────
  {
    const question = `How much does a ${subNameLower} cost in Australia?`;
    let answer: string;

    if (stats.hasEnoughData && stats.price) {
      answer =
        `Based on ${stats.totalCount} quotes analysed by QOAT, ${subNameLower} in Australia typically costs between ` +
        `${formatAUD(stats.price.min)} and ${formatAUD(stats.price.max)}, with a median of ${formatAUD(stats.price.median)}. ` +
        `Prices vary with scope, materials, and location — see the distribution above for the full picture.`;
    } else if (stats.price) {
      answer =
        `${subName} in Australia typically ranges from ${formatAUD(stats.price.min)} to ${formatAUD(stats.price.max)}. ` +
        `We're still building our data for this category — these figures come from ${stats.totalCount} quotes and our curated Australian market reference.`;
    } else {
      answer =
        `We're still building pricing data for ${subNameLower}. Upload your quote and QOAT will analyse it against Australian market rates.`;
    }

    faqs.push({ question, answer });
  }

  // ── Q2: Price drivers ─────────────────────────────────────────────────────
  if (content.priceDrivers.length > 0) {
    const processedDrivers = content.priceDrivers.map((d) => {
      const stripped = d.endsWith(".") ? d.slice(0, -1) : d;
      return stripped.charAt(0).toLowerCase() + stripped.slice(1);
    });
    faqs.push({
      question: `What affects the price of ${subNameLower}?`,
      answer:
        `Several factors drive the price: ${processedDrivers.join("; ")}. ` +
        `The biggest swing is usually scope — a small job and a full replacement can differ by several times.`,
    });
  }

  // ── Q3: Permits ───────────────────────────────────────────────────────────
  if (content.permitNotes !== FALLBACK_PERMIT_NOTES) {
    faqs.push({
      question: `Do I need a permit for ${subNameLower}?`,
      answer: content.permitNotes,
    });
  }

  // ── Q4: Is my quote fair (static) ─────────────────────────────────────────
  faqs.push({
    question: "How do I know if my quote is fair?",
    answer:
      "Upload it to QOAT. We analyse the quote against real Australian market data, comparable quotes in our database, and a curated price reference — then give you a clear read on price, supplier reputation, and timeframe, plus the specific questions to ask before you commit. It's free and takes about a minute.",
  });

  // ── Bespoke per-category FAQs ─────────────────────────────────────────────
  for (const item of content.faqs) {
    faqs.push(item);
  }

  return faqs;
}
