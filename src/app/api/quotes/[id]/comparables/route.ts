import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPublicPrice } from "@/lib/formatPrice";

type ComparableRow = {
  id: string;
  title: string;
  suburb: string | null;
  state: string | null;
  fileType: string;
  category_name: string;
  category_slug: string;
  totalAmount: number | string | null;
  similarity: number | string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Load the analysis for this quote (owner check + get comparable IDs + embedding)
  const analysis = await prisma.quoteAnalysis.findUnique({
    where: { quoteId: id },
    select: { quoteId: true, priceComparableIds: true },
  });

  if (!analysis) return Response.json({ error: "Not found" }, { status: 404 });

  // Verify owner
  const quote = await prisma.quote.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!quote) return Response.json({ error: "Not found" }, { status: 404 });
  if (quote.userId !== session.user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  const ids = analysis.priceComparableIds;

  if (ids.length === 0) {
    return Response.json({ comparables: [] });
  }

  // Fetch comparable quotes with similarity recomputed via cosine distance on stored embeddings
  const rows = await prisma.$queryRawUnsafe<ComparableRow[]>(
    `SELECT
       q.id,
       q.title,
       q.suburb,
       q.state,
       q."fileType",
       cat.name AS category_name,
       cat.slug AS category_slug,
       comp_qa."totalAmount",
       CASE
         WHEN main_qa.embedding IS NOT NULL AND comp_qa.embedding IS NOT NULL
         THEN 1 - (comp_qa.embedding <=> main_qa.embedding)
         ELSE NULL
       END AS similarity
     FROM "QuoteAnalysis" main_qa
     JOIN "QuoteAnalysis" comp_qa ON comp_qa."quoteId" = ANY($2::text[])
     JOIN "Quote" q ON q.id = comp_qa."quoteId"
     JOIN "Category" cat ON cat.id = q."categoryId"
     WHERE main_qa."quoteId" = $1
       AND q.hidden = false
     ORDER BY similarity DESC NULLS LAST`,
    id,
    ids
  );

  const comparables = rows.map((r) => ({
    id: r.id,
    title: r.title,
    suburb: r.suburb,
    state: r.state,
    categoryName: r.category_name,
    publicTotal:
      r.totalAmount != null
        ? formatPublicPrice(Number(r.totalAmount), r.category_slug)
        : null,
    similarityPct:
      r.similarity != null ? Math.round(Number(r.similarity) * 100) : null,
  }));

  return Response.json({ comparables });
}
