import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const categorySlug = searchParams.get("category") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  const where = {
    ...(categorySlug && { category: { slug: categorySlug } }),
    ...(state && { state }),
  };

  const [quotes, totalCount] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        userId: true,
        title: true,
        suburb: true,
        state: true,
        createdAt: true,
        category: { select: { name: true, slug: true } },
        analysis: {
          select: {
            totalAmount: true,
            priceScore: true,
            reputationScore: true,
            timeScore: true,
          },
        },
        _count: {
          select: { votes: true, comments: true },
        },
      },
    }),
    prisma.quote.count({ where }),
  ]);

  const data = quotes.map((q) => ({
    id: q.id,
    userId: q.userId,
    title: q.title,
    suburb: q.suburb,
    state: q.state,
    createdAt: q.createdAt,
    category: q.category,
    totalAmount: q.analysis?.totalAmount ?? null,
    priceScore: q.analysis?.priceScore ?? null,
    reputationScore: q.analysis?.reputationScore ?? null,
    timeScore: q.analysis?.timeScore ?? null,
    voteCount: q._count.votes,
    commentCount: q._count.comments,
  }));

  return Response.json({
    quotes: data,
    page,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
    totalCount,
  });
}
