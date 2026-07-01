import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { extractQuote } from "@/lib/extractQuote";
import { scoreQuote } from "@/lib/scoreQuote";
import { findSupplierReviews } from "@/lib/googlePlaces";
import { getComparableQuotes } from "@/lib/getComparables";
import { generateEmbedding, buildEmbeddingText } from "@/lib/embeddings";
import { getReputationSignals } from "@/lib/getReputationSignals";
import { assessCompliance } from "@/lib/assessCompliance";
import { CURRENT_METHODOLOGY_VERSION, MODEL_VERSION } from "@/lib/methodology";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      fileUrl: true,
      fileType: true,
      description: true,
      suburb: true,
      state: true,
      categoryId: true,
      category: { select: { name: true, slug: true } },
    },
  });

  if (!quote) return Response.json({ error: "Not found" }, { status: 404 });
  if (quote.userId !== session.user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  const basePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/quotes/`;
  const storagePath = quote.fileUrl.startsWith(basePrefix)
    ? quote.fileUrl.slice(basePrefix.length)
    : null;

  if (!storagePath) return Response.json({ error: "File not found" }, { status: 400 });

  await prisma.quote.update({ where: { id }, data: { analysisStatus: "extracting" } });
  let extraction;
  try {
    extraction = await extractQuote(storagePath, quote.fileType, quote.description);
  } catch (err) {
    await prisma.quote.update({ where: { id }, data: { analysisStatus: "failed" } });
    throw err;
  }
  await prisma.quote.update({ where: { id }, data: { analysisStatus: "scoring" } });

  // Update subcategoryId from new taxonomy
  let subcategoryId: string | null = null;
  if (extraction.inferredSubcategorySlug) {
    const sub = await prisma.subcategory.findUnique({
      where: { slug: extraction.inferredSubcategorySlug },
    });
    subcategoryId = sub?.id ?? null;
  }
  await prisma.quote.update({ where: { id }, data: { subcategoryId } });

  // Fetch fresh Google reviews
  let googleReviews = null;
  if (extraction.supplierName) {
    googleReviews = await findSupplierReviews(
      extraction.supplierName,
      quote.suburb ?? "",
      quote.state ?? "",
      quote.category?.slug ?? "other"
    );
  }

  // Generate embedding for semantic comparable lookup
  const categoryName = quote.category?.name ?? "trade";
  const categorySlug = quote.category?.slug ?? "";
  const embeddingText = buildEmbeddingText(
    categoryName,
    extraction.publicSummary,
    extraction.lineItems as Array<{ description?: string | null }>
  );
  let embedding: number[] | null = null;
  try {
    embedding = await generateEmbedding(embeddingText);
  } catch (err) {
    console.error("[analyse] embedding generation failed:", err);
  }

  const comparables = embedding
    ? await getComparableQuotes(embedding, id)
    : { count: 0, averageTotal: null, medianTotal: null, minTotal: null, maxTotal: null, sampleSize: 0, avgSimilarity: null, comparableIds: [] as string[] };

  const googleDataForSignals =
    googleReviews?.confident && googleReviews?.rating != null && googleReviews?.reviewCount != null
      ? { rating: googleReviews.rating, reviewCount: googleReviews.reviewCount }
      : null;
  let reputationSignals = null;
  try {
    reputationSignals = await getReputationSignals({
      extraction,
      googleData: googleDataForSignals,
      categorySlug,
      supplierName: extraction.supplierName ?? null,
      excludeQuoteId: id,
    });
    console.log("[analyse] reputation signals built:", JSON.stringify(reputationSignals));
  } catch (err) {
    console.error("[analyse] getReputationSignals failed:", err);
  }

  let complianceFlags = null;
  try {
    complianceFlags = await assessCompliance(extraction, {
      suburb: quote.suburb ?? null,
      state: quote.state ?? null,
    });
    console.log("[analyse] compliance flags assessed");
  } catch (err) {
    console.error("[analyse] assessCompliance failed:", err);
  }

  const score = await scoreQuote(
    extraction,
    { suburb: quote.suburb ?? undefined, state: quote.state ?? undefined },
    quote.description,
    null,
    comparables,
    reputationSignals,
    extraction.jobSize
  );

  const data = {
    rawExtraction: extraction,
    supplierName: extraction.supplierName ?? undefined,
    totalAmount: extraction.totalAmount ?? undefined,
    lineItems: extraction.lineItems,
    redFlags: extraction.redFlags,
    questionsToAsk: extraction.questionsToAsk,
    summary: extraction.summary ?? undefined,
    publicSummary: extraction.publicSummary ?? undefined,
    estimatedTimeframe: extraction.estimatedTimeframe ?? undefined,
    googleRating: googleReviews?.confident ? (googleReviews.rating ?? null) : null,
    googleReviewCount: googleReviews?.confident ? (googleReviews.reviewCount ?? null) : null,
    googlePlaceId: googleReviews?.confident ? (googleReviews.placeId ?? null) : null,
    googleUrl: googleReviews?.confident ? (googleReviews.googleUrl ?? null) : null,
    googleReviews: googleReviews?.confident ? (googleReviews.reviews ?? Prisma.DbNull) : Prisma.DbNull,
    googleMatchConfident: googleReviews?.confident ?? false,
    googleDiagnostics: googleReviews?.diagnostics ?? Prisma.DbNull,
    reputationSignals: reputationSignals ?? undefined,
    complianceFlags: complianceFlags ?? undefined,
    methodologyVersion: CURRENT_METHODOLOGY_VERSION,
    modelVersion: MODEL_VERSION,
    jobSize: extraction.jobSize ?? undefined,
    qualityTier: extraction.qualityTier,
    priceComparableIds: comparables.comparableIds,
    priceSampleSize: comparables.sampleSize >= 3 ? comparables.sampleSize : null,
    priceScore: score.price.score,
    priceVerdict: score.price.verdict,
    priceExplanation: score.price.explanation,
    reputationScore: score.reputation.score,
    reputationVerdict: score.reputation.verdict,
    reputationExplanation: score.reputation.explanation,
    timeScore: score.time.score,
    timeVerdict: score.time.verdict,
    timeExplanation: score.time.explanation,
    recommendation: score.overall.recommendation,
    overallSummary: score.overall.summary,
  };

  const analysis = await prisma.quoteAnalysis.upsert({
    where: { quoteId: id },
    create: { quoteId: id, ...data },
    update: data,
  });

  // Store embedding via raw SQL (vector type unsupported in Prisma ORM)
  if (embedding) {
    await prisma.$executeRawUnsafe(
      `UPDATE "QuoteAnalysis" SET embedding = $1::vector WHERE id = $2`,
      `[${embedding.join(",")}]`,
      analysis.id
    );
  }

  await prisma.quote.update({ where: { id }, data: { analysisStatus: "complete" } });

  return Response.json(analysis);
}
