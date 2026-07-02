import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { type Metadata } from "next";
import QuoteFeed, { type FeedQuote, type SortOption } from "@/app/QuoteFeed";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Community quotes — QOAT",
  description: "Browse real Australian trade quotes analysed by QOAT — prices, scores, and community insight.",
};

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    sort?: string;
    category?: string;
    state?: string;
  }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const role = (session?.user as { role?: string } | undefined)?.role ?? "user";
  const isPrivileged = role === "admin" || role === "moderator";

  const visibilityWhere = {
    OR: [{ hidden: false }, ...(currentUserId ? [{ userId: currentUserId }] : [])],
  };

  const categories = CATEGORIES.map((c) => ({ slug: c.slug, name: c.name }));

  const [initialData, totalCount] = await Promise.all([
    prisma.quote.findMany({
      where: visibilityWhere,
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        userId: true,
        title: true,
        hidden: true,
        isSeed: true,
        suburb: true,
        state: true,
        createdAt: true,
        category: { select: { name: true, slug: true } },
        subcategory: { select: { name: true, topCategory: { select: { name: true } } } },
        analysis: {
          select: { totalAmount: true, priceScore: true, reputationScore: true, timeScore: true },
        },
        _count: { select: { votes: true, comments: true, helpfulMarks: true, similarQuotes: true } },
      },
    }),
    prisma.quote.count({ where: visibilityWhere }),
  ]);

  const initialQuotes: FeedQuote[] = initialData.map((q) => ({
    id: q.id,
    userId: q.userId,
    title: q.title,
    hidden: q.hidden,
    isSeed: q.isSeed,
    suburb: q.suburb,
    state: q.state,
    createdAt: q.createdAt.toISOString(),
    category: q.category,
    subcategory: q.subcategory
      ? { name: q.subcategory.name, topCategory: { name: q.subcategory.topCategory.name } }
      : null,
    totalAmount: q.analysis?.totalAmount ?? null,
    priceScore: q.analysis?.priceScore ?? null,
    reputationScore: q.analysis?.reputationScore ?? null,
    timeScore: q.analysis?.timeScore ?? null,
    voteCount: q._count.votes,
    commentCount: q._count.comments,
    helpfulCount: q._count.helpfulMarks,
    similarCount: q._count.similarQuotes,
    analysisComplete: q.analysis !== null,
  }));

  const validSorts = ["newest", "oldest", "price-high", "price-low", "most-helpful", "most-discussed"];
  const initialSort = (validSorts.includes(sp.sort ?? "") ? sp.sort : "newest") as SortOption;

  return (
    <main className="min-h-screen bg-surface pt-14">
      <section className="max-w-5xl mx-auto px-6 pt-12 pb-20">
        <QuoteFeed
          initialQuotes={initialQuotes}
          initialTotalPages={Math.ceil(totalCount / 20)}
          initialTotalCount={totalCount}
          categories={categories}
          currentUserId={currentUserId}
          isPrivileged={isPrivileged}
          initialSearch={sp.search ?? ""}
          initialSort={initialSort}
          initialCategory={sp.category ?? null}
          initialState={sp.state ?? ""}
        />
      </section>
    </main>
  );
}
