import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import QuoteFeed, { type FeedQuote, type SortOption } from "./QuoteFeed";

export default async function HomePage({
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
  const isLoggedIn = !!session?.user;
  const currentUserId = session?.user?.id ?? null;
  const role = session?.user?.role ?? "user";
  const isPrivileged = role === "admin" || role === "moderator";

  // SSR initial load always uses default visibility (toggle=off); client refetches if toggle was on
  const visibilityWhere = { OR: [{ hidden: false }, ...(currentUserId ? [{ userId: currentUserId }] : [])] };

  const [categories, initialData, totalCount] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.quote.findMany({
      where: visibilityWhere,
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        userId: true,
        title: true,
        hidden: true,
        suburb: true,
        state: true,
        createdAt: true,
        category: { select: { name: true, slug: true } },
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
    suburb: q.suburb,
    state: q.state,
    createdAt: q.createdAt.toISOString(),
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

  const initialTotalPages = Math.ceil(totalCount / 20);

  const validSorts = ["newest", "oldest", "price-high", "price-low", "most-helpful", "most-discussed"];
  const initialSort = (validSorts.includes(sp.sort ?? "") ? sp.sort : "newest") as SortOption;

  return (
    <main className="min-h-screen bg-surface pt-14">
      {/* Hero — logged out only */}
      {!isLoggedIn && (
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16">
          <h1 className="text-5xl font-extrabold tracking-tighter text-primary leading-tight max-w-xl">
            Know before you pay.
          </h1>
          <p className="mt-4 text-lg text-on-surface-variant max-w-md leading-relaxed">
            Upload your trade or supplier quote and get an instant AI assessment plus community insight.
          </p>
          <div className="mt-8">
            <Link
              href="/upload"
              className="inline-block px-6 py-3 bg-[#111111] text-white rounded-[12px] font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Submit a Quote
            </Link>
          </div>
        </section>
      )}

      {/* Feed */}
      <section className={`max-w-5xl mx-auto px-6 pb-20 ${isLoggedIn ? "pt-12" : ""}`}>
        <QuoteFeed
          initialQuotes={initialQuotes}
          initialTotalPages={initialTotalPages}
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
