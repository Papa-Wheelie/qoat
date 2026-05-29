import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const isAdmin = session?.user?.role === "admin";

  const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);

  if (ids.length === 0) {
    return Response.json({ error: "ids required" }, { status: 400 });
  }

  const [quotes, similarGroups] = await Promise.all([
    prisma.quote.findMany({
      where: {
        id: { in: ids },
        ...(isAdmin ? {} : { OR: [{ hidden: false }, ...(userId ? [{ userId }] : [])] }),
      },
      select: {
        id: true,
        title: true,
        userId: true,
        suburb: true,
        state: true,
        status: true,
        category: { select: { name: true, slug: true } },
        analysis: {
          select: {
            publicSummary: true,
            totalAmount: true,
            lineItems: true,
            priceScore: true,
            reputationScore: true,
            timeScore: true,
            recommendation: true,
          },
        },
        _count: { select: { helpfulMarks: true, comments: true, similarQuotes: true } },
      },
    }),
    prisma.similarQuote.groupBy({
      by: ["quoteId"],
      where: { quoteId: { in: ids } },
      _avg: { price: true },
      _count: { _all: true },
    }),
  ]);

  const similarByQuoteId = new Map(
    similarGroups.map((g) => [g.quoteId, { avgPrice: g._avg.price, count: g._count._all }])
  );

  const result = quotes.map((q) => {
    const isOwner = q.userId === userId;
    const lineItemCount = Array.isArray(q.analysis?.lineItems) ? (q.analysis.lineItems as unknown[]).length : 0;
    const similar = similarByQuoteId.get(q.id) ?? { avgPrice: null, count: 0 };

    return {
      id: q.id,
      title: q.title,
      isOwner,
      category: q.category,
      suburb: q.suburb,
      state: q.state,
      publicSummary: q.analysis?.publicSummary ?? null,
      totalAmount: q.analysis?.totalAmount ?? null,
      lineItemCount,
      helpfulCount: q._count.helpfulMarks,
      commentCount: q._count.comments,
      similarCount: q._count.similarQuotes,
      similarAvgPrice: similar.avgPrice,
      // Owner-only — null for non-owners
      status: isOwner ? q.status : null,
      priceScore: isOwner ? (q.analysis?.priceScore ?? null) : null,
      reputationScore: isOwner ? (q.analysis?.reputationScore ?? null) : null,
      timeScore: isOwner ? (q.analysis?.timeScore ?? null) : null,
      recommendation: isOwner ? (q.analysis?.recommendation ?? null) : null,
    };
  });

  // Return in requested order (quotes come back in DB order)
  const ordered = ids
    .map((id) => result.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => r != null);

  return Response.json({ quotes: ordered });
}
