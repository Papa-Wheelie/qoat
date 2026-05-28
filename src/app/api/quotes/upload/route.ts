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
    const title = formData.get("title") as string | null;
    const categoryId = formData.get("categoryId") as string | null;
    const description = formData.get("description") as string | null;
    const suburb = formData.get("suburb") as string | null;
    const state = formData.get("state") as string | null;

    if (!file || !title || !categoryId) {
      return Response.json(
        { error: "file, title, and categoryId are required" },
        { status: 400 }
      );
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

    // Save Quote record
    const quote = await prisma.quote.create({
      data: {
        title,
        description: description ?? undefined,
        suburb: suburb ?? undefined,
        state: state ?? undefined,
        fileUrl: publicUrlData.publicUrl,
        fileName: file.name,
        fileType: file.type,
        userId: session.user.id,
        categoryId,
      },
    });

    // Run AI extraction + scoring — non-blocking, do not fail the upload on error
    console.log("[upload] starting extraction for quote", quote.id, "path:", storagePath);
    extractQuote(storagePath, file.type, description)
      .then(async (extraction) => {
        console.log("[upload] extraction succeeded for quote", quote.id, "summary:", extraction.summary);

        // Fetch Google reviews if supplier name is available
        let googleReviews = null;
        if (extraction.supplierName) {
          console.log("[upload] fetching Google reviews for:", extraction.supplierName);
          googleReviews = await findSupplierReviews(
            extraction.supplierName,
            suburb ?? "",
            state ?? ""
          );
          console.log("[upload] Google reviews:", googleReviews);
        }

        // Fetch category for embedding text + reputation signals
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
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
          console.log("[upload] embedding generated for quote", quote.id);
        } catch (err) {
          console.error("[upload] embedding generation failed for quote", quote.id, err);
        }

        // Fetch comparable quotes for price benchmarking
        const comparables = embedding
          ? await getComparableQuotes(embedding, quote.id)
          : { count: 0, averageTotal: null, medianTotal: null, minTotal: null, maxTotal: null, sampleSize: 0, avgSimilarity: null };
        console.log("[upload] comparables for quote", quote.id, "sampleSize:", comparables.sampleSize);

        // Build reputation signals composite
        const googleDataForSignals =
          googleReviews?.rating != null && googleReviews?.reviewCount != null
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
          console.log("[upload] reputation signals built for quote", quote.id);
        } catch (err) {
          console.error("[upload] getReputationSignals failed for quote", quote.id, err);
        }

        // Compliance assessment
        let complianceFlags = null;
        try {
          complianceFlags = await assessCompliance(extraction, { suburb, state });
          console.log("[upload] compliance flags assessed for quote", quote.id);
        } catch (err) {
          console.error("[upload] assessCompliance failed for quote", quote.id, err);
        }

        // Score the quote
        let score;
        try {
          console.log("[upload] starting scoring for quote", quote.id);
          score = await scoreQuote(extraction, { suburb, state }, description, null, comparables, reputationSignals);
          console.log("[upload] scoring succeeded for quote", quote.id, "recommendation:", score.overall.recommendation);
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
            googleRating: googleReviews?.rating ?? undefined,
            googleReviewCount: googleReviews?.reviewCount ?? undefined,
            googlePlaceId: googleReviews?.placeId ?? undefined,
            googleUrl: googleReviews?.googleUrl ?? undefined,
            googleReviews: googleReviews?.reviews ?? undefined,
            reputationSignals: reputationSignals ?? undefined,
            complianceFlags: complianceFlags ?? undefined,
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
        // Store embedding via raw SQL (vector type unsupported in Prisma ORM)
        if (embedding) {
          await prisma.$executeRawUnsafe(
            `UPDATE "QuoteAnalysis" SET embedding = $1::vector WHERE id = $2`,
            `[${embedding.join(",")}]`,
            saved.id
          );
          console.log("[upload] embedding stored for analysis", saved.id);
        }
        console.log("[upload] analysis saved, id:", saved.id);
      })
      .catch((err) => console.error("[upload] extraction failed for quote", quote.id, err));

    return Response.json(quote, { status: 201 });
  } catch (error) {
    console.error("[upload] unhandled error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
