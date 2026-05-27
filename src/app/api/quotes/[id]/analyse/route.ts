import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { extractQuote } from "@/lib/extractQuote";
import { scoreQuote } from "@/lib/scoreQuote";
import { findSupplierReviews } from "@/lib/googlePlaces";
import { getComparableQuotes } from "@/lib/getComparables";
import { generateEmbedding, buildEmbeddingText } from "@/lib/embeddings";

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
    },
  });

  if (!quote) return Response.json({ error: "Not found" }, { status: 404 });
  if (quote.userId !== session.user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  const basePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/quotes/`;
  const storagePath = quote.fileUrl.startsWith(basePrefix)
    ? quote.fileUrl.slice(basePrefix.length)
    : null;

  if (!storagePath) return Response.json({ error: "File not found" }, { status: 400 });

  const extraction = await extractQuote(storagePath, quote.fileType, quote.description);

  // Fetch fresh Google reviews
  let googleReviews = null;
  if (extraction.supplierName) {
    googleReviews = await findSupplierReviews(
      extraction.supplierName,
      quote.suburb ?? "",
      quote.state ?? ""
    );
  }

  const googleReviewsForScoring =
    googleReviews?.rating != null && googleReviews?.reviewCount != null
      ? { rating: googleReviews.rating, reviewCount: googleReviews.reviewCount }
      : null;

  // Generate embedding for semantic comparable lookup
  const category = await prisma.category.findUnique({
    where: { id: quote.categoryId },
    select: { name: true },
  });
  const categoryName = category?.name ?? "trade";
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
    : { count: 0, averageTotal: null, medianTotal: null, minTotal: null, maxTotal: null, sampleSize: 0, avgSimilarity: null };

  const score = await scoreQuote(
    extraction,
    { suburb: quote.suburb ?? undefined, state: quote.state ?? undefined },
    quote.description,
    googleReviewsForScoring,
    comparables
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
    googleRating: googleReviews?.rating ?? null,
    googleReviewCount: googleReviews?.reviewCount ?? null,
    googlePlaceId: googleReviews?.placeId ?? null,
    googleUrl: googleReviews?.googleUrl ?? null,
    googleReviews: googleReviews?.reviews ?? Prisma.DbNull,
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

  return Response.json(analysis);
}
