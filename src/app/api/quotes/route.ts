import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const PAGE_SIZE = 20;

const SORT_OPTIONS = {
  newest:          { createdAt: "desc" as const },
  oldest:          { createdAt: "asc" as const },
  "price-high":    { analysis: { totalAmount: { sort: "desc" as const, nulls: "last" as const } } },
  "price-low":     { analysis: { totalAmount: { sort: "asc" as const, nulls: "last" as const } } },
  "most-helpful":  { helpfulMarks: { _count: "desc" as const } },
  "most-discussed":{ comments: { _count: "desc" as const } },
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const categorySlug = searchParams.get("category") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const search = searchParams.get("search")?.trim() ?? undefined;
  const sortKey = (searchParams.get("sort") ?? "newest") as SortKey;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  const orderBy = SORT_OPTIONS[sortKey] ?? SORT_OPTIONS.newest;

  const searchFilter = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { category: { name: { contains: search, mode: "insensitive" as const } } },
          { suburb: { contains: search, mode: "insensitive" as const } },
          { analysis: { publicSummary: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const where = {
    ...(categorySlug && { category: { slug: categorySlug } }),
    ...(state && { state }),
    ...searchFilter,
  };

  const [quotes, totalCount] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy,
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
          select: { votes: true, comments: true, helpfulMarks: true, similarQuotes: true },
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
    helpfulCount: q._count.helpfulMarks,
    similarCount: q._count.similarQuotes,
  }));

  return Response.json({
    quotes: data,
    page,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
    totalCount,
  });
}
