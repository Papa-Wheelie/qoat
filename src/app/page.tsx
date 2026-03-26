import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Nav from "@/components/Nav";
import QuoteFeed, { type FeedQuote } from "./QuoteFeed";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const currentUserId = session?.user?.id ?? null;

  const [categories, initialData] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        userId: true,
        title: true,
        suburb: true,
        state: true,
        createdAt: true,
        category: { select: { name: true, slug: true } },
        analysis: {
          select: { totalAmount: true, priceScore: true, reputationScore: true, timeScore: true },
        },
        _count: { select: { votes: true, comments: true } },
      },
    }),
  ]);

  const totalCount = await prisma.quote.count();

  const initialQuotes: FeedQuote[] = initialData.map((q) => ({
    id: q.id,
    userId: q.userId,
    title: q.title,
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
  }));

  const initialTotalPages = Math.ceil(totalCount / 20);

  return (
    <>
      <Nav />
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
            categories={categories}
            currentUserId={currentUserId}
          />
        </section>
      </main>
    </>
  );
}
