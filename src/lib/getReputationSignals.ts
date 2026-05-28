import { prisma } from "./prisma";
import type { QuoteExtraction } from "./extractQuote";

// Categories that legally require a trade licence in Australia
const LICENCE_REQUIRED_SLUGS = new Set([
  "electrical",
  "plumbing",
  "building-construction",
  "hvac-heating",
]);

export type ReputationSignals = {
  googleRating: number | null;
  googleReviewCount: number | null;
  hasABN: boolean;
  abnNumber: string | null;
  hasLicence: boolean;
  licenceNumber: string | null;
  licenceRequired: boolean;
  hasInsurance: boolean;
  yearsInBusiness: number | null;
  qoatQuoteCount: number;
};

export async function getReputationSignals(params: {
  extraction: QuoteExtraction;
  googleData: { rating: number; reviewCount: number } | null;
  categorySlug: string;
  supplierName: string | null;
  excludeQuoteId?: string;
}): Promise<ReputationSignals> {
  const { extraction, googleData, categorySlug, supplierName, excludeQuoteId } = params;

  const qoatQuoteCount = supplierName
    ? await prisma.quoteAnalysis.count({
        where: {
          supplierName: { equals: supplierName, mode: "insensitive" },
          ...(excludeQuoteId ? { quoteId: { not: excludeQuoteId } } : {}),
        },
      })
    : 0;

  return {
    googleRating: googleData?.rating ?? null,
    googleReviewCount: googleData?.reviewCount ?? null,
    hasABN: !!extraction.abnNumber,
    abnNumber: extraction.abnNumber ?? null,
    hasLicence: !!extraction.licenceNumber,
    licenceNumber: extraction.licenceNumber ?? null,
    licenceRequired: LICENCE_REQUIRED_SLUGS.has(categorySlug),
    hasInsurance: extraction.hasInsurance,
    yearsInBusiness: null, // placeholder — future ABR lookup
    qoatQuoteCount,
  };
}
