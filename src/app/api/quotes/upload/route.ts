import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { extractQuote } from "@/lib/extractQuote";
import { scoreQuote } from "@/lib/scoreQuote";
import { findSupplierReviews } from "@/lib/googlePlaces";
import { getComparableQuotes } from "@/lib/getComparables";
import { generateEmbedding, buildEmbeddingText } from "@/lib/embeddings";
import { getReputationSignals } from "@/lib/getReputationSignals";
import { assessCompliance } from "@/lib/assessCompliance";
import { CURRENT_METHODOLOGY_VERSION, MODEL_VERSION } from "@/lib/methodology";

export const ANALYSING_PLACEHOLDER = "New quote — analysing...";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: "File must be a PDF, JPG, PNG, or WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: "File exceeds 10MB limit" }, { status: 400 });
    }

    // Find the "other" placeholder category
    const otherCategory = await prisma.category.findFirst({ where: { slug: "other" } });
    if (!otherCategory) {
      return Response.json({ error: "Category setup error" }, { status: 500 });
    }

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `${session.user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("quotes")
      .upload(storagePath, buffer, { contentType: file.type });

    if (uploadError) {
      return Response.json(
        { error: "File upload failed", details: uploadError.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("quotes")
      .getPublicUrl(storagePath);

    // Create Quote with placeholder values — AI will update these after extraction
    const quote = await prisma.quote.create({
      data: {
        title: ANALYSING_PLACEHOLDER,
        fileUrl: publicUrlData.publicUrl,
        fileName: file.name,
        fileType: file.type,
        userId: session.user.id,
        categoryId: otherCategory.id,
        welcomeAcknowledged: false,
      },
    });

    // Run AI extraction + scoring — non-blocking
    console.log("[upload] starting extraction for quote", quote.id, "path:", storagePath);
    prisma.quote.update({ where: { id: quote.id }, data: { analysisStatus: "extracting" } }).catch(() => {});
    extractQuote(storagePath, file.type)
      .then(async (extraction) => {
        console.log("[upload] extraction succeeded for quote", quote.id);
        await prisma.quote.update({ where: { id: quote.id }, data: { analysisStatus: "scoring" } });

        // Look up the inferred category, fall back to "other"
        const inferredCategory = await prisma.category.findFirst({
          where: { slug: extraction.inferredCategorySlug },
        });
        const resolvedCategoryId = inferredCategory?.id ?? otherCategory.id;

        // Check if user has already set location (race: they saved it via welcome banner)
        const freshQuote = await prisma.quote.findUnique({
          where: { id: quote.id },
          select: { locationEdited: true },
        });

        // Update Quote with AI-inferred fields
        await prisma.quote.update({
          where: { id: quote.id },
          data: {
            title: extraction.inferredTitle,
            categoryId: resolvedCategoryId,
            // Only set location from AI if user hasn't saved one manually
            ...(!freshQuote?.locationEdited && {
              suburb: extraction.suburb ?? null,
              state: extraction.state ?? null,
            }),
          },
        });
        console.log("[upload] quote updated — title:", extraction.inferredTitle, "category:", extraction.inferredCategorySlug);

        // Use the resolved location for downstream calls
        const resolvedSuburb = freshQuote?.locationEdited
          ? (await prisma.quote.findUnique({ where: { id: quote.id }, select: { suburb: true, state: true } }))?.suburb ?? extraction.suburb ?? null
          : extraction.suburb ?? null;
        const resolvedState = freshQuote?.locationEdited
          ? (await prisma.quote.findUnique({ where: { id: quote.id }, select: { suburb: true, state: true } }))?.state ?? extraction.state ?? null
          : extraction.state ?? null;

        // Fetch Google reviews if supplier name is available
        let googleReviews = null;
        if (extraction.supplierName) {
          googleReviews = await findSupplierReviews(
            extraction.supplierName,
            resolvedSuburb ?? "",
            resolvedState ?? "",
            extraction.inferredCategorySlug
          );
        }

        // Fetch category for embedding text + reputation signals
        const category = await prisma.category.findUnique({
          where: { id: resolvedCategoryId },
          select: { name: true, slug: true },
        });
        const categoryName = category?.name ?? "trade";
        const categorySlug = category?.slug ?? "";

        // Generate embedding for semantic comparable lookup
        const embeddingText = buildEmbeddingText(
          categoryName,
          extraction.publicSummary,
          extraction.lineItems as Array<{ description?: string | null }>
        );
        let embedding: number[] | null = null;
        try {
          embedding = await generateEmbedding(embeddingText);
        } catch (err) {
          console.error("[upload] embedding generation failed for quote", quote.id, err);
        }

        const comparables = embedding
          ? await getComparableQuotes(embedding, quote.id)
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
            excludeQuoteId: quote.id,
          });
        } catch (err) {
          console.error("[upload] getReputationSignals failed for quote", quote.id, err);
        }

        let complianceFlags = null;
        try {
          complianceFlags = await assessCompliance(extraction, {
            suburb: resolvedSuburb,
            state: resolvedState,
          });
        } catch (err) {
          console.error("[upload] assessCompliance failed for quote", quote.id, err);
        }

        let score;
        try {
          score = await scoreQuote(
            extraction,
            { suburb: resolvedSuburb ?? undefined, state: resolvedState ?? undefined },
            null,
            null,
            comparables,
            reputationSignals,
            extraction.jobSize
          );
        } catch (err) {
          console.error("[upload] scoring failed for quote", quote.id, err);
        }

        const saved = await prisma.quoteAnalysis.create({
          data: {
            quoteId: quote.id,
            rawExtraction: extraction,
            supplierName: extraction.supplierName ?? undefined,
            totalAmount: extraction.totalAmount ?? undefined,
            lineItems: extraction.lineItems,
            redFlags: extraction.redFlags,
            questionsToAsk: extraction.questionsToAsk,
            summary: extraction.summary ?? undefined,
            publicSummary: extraction.publicSummary ?? undefined,
            estimatedTimeframe: extraction.estimatedTimeframe ?? undefined,
            googleRating: googleReviews?.confident ? (googleReviews.rating ?? undefined) : undefined,
            googleReviewCount: googleReviews?.confident ? (googleReviews.reviewCount ?? undefined) : undefined,
            googlePlaceId: googleReviews?.confident ? (googleReviews.placeId ?? undefined) : undefined,
            googleUrl: googleReviews?.confident ? (googleReviews.googleUrl ?? undefined) : undefined,
            googleReviews: googleReviews?.confident ? (googleReviews.reviews ?? undefined) : undefined,
            googleMatchConfident: googleReviews?.confident ?? false,
            googleDiagnostics: googleReviews?.diagnostics ?? undefined,
            reputationSignals: reputationSignals ?? undefined,
            complianceFlags: complianceFlags ?? undefined,
            methodologyVersion: CURRENT_METHODOLOGY_VERSION,
            modelVersion: MODEL_VERSION,
            jobSize: extraction.jobSize ?? undefined,
            priceComparableIds: comparables.comparableIds,
            ...(score && {
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
            }),
          },
        });

        if (embedding) {
          await prisma.$executeRawUnsafe(
            `UPDATE "QuoteAnalysis" SET embedding = $1::vector WHERE id = $2`,
            `[${embedding.join(",")}]`,
            saved.id
          );
        }
        await prisma.quote.update({ where: { id: quote.id }, data: { analysisStatus: "complete" } });
        console.log("[upload] analysis saved, id:", saved.id);
      })
      .catch((err) => {
        console.error("[upload] extraction failed for quote", quote.id, err);
        prisma.quote.update({ where: { id: quote.id }, data: { analysisStatus: "failed" } }).catch(() => {});
      });

    return Response.json({ id: quote.id }, { status: 201 });
  } catch (error) {
    console.error("[upload] unhandled error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
