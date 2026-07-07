import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/categories";
import { getTopCategoryStats } from "@/lib/categoryStats";
import { getTopCategoryContent } from "@/lib/subcategoryContent";
import CategoryCard from "@/components/CategoryCard";
import DashboardQuoteCard from "@/components/DashboardQuoteCard";

type Props = {
  userId: string;
};

export default async function HomepageDashboard({ userId }: Props) {
  const [user, quotesData, quoteCount, topCategoryResults] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    prisma.quote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        createdAt: true,
        subcategory: {
          select: {
            name: true,
            topCategory: { select: { slug: true } },
          },
        },
        analysis: {
          select: { totalAmount: true },
        },
      },
    }),
    prisma.quote.count({ where: { userId } }),
    Promise.all(
      CATEGORIES.map(async (top) => {
        const stats = await getTopCategoryStats(top.slug);
        const content = getTopCategoryContent(top.slug);
        return { top, stats, content };
      })
    ),
  ]);

  const firstName = user?.name?.split(" ")[0] ?? null;
  const recentQuotes = quotesData.slice(0, 3);
  const userTopSlugs = new Set(
    quotesData.flatMap((q) =>
      q.subcategory?.topCategory?.slug ? [q.subcategory.topCategory.slug] : []
    )
  );

  const uploadedInResults = topCategoryResults.filter(({ top }) =>
    userTopSlugs.has(top.slug)
  );

  return (
    <main className="min-h-screen bg-surface pt-14">

      {/* ── A: Dashboard hero ─────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-10 pb-8">
        <div className="space-y-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">
            Welcome back{firstName ? `, ${firstName}` : ""}.
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/upload"
              className="px-5 py-2.5 bg-[#111111] text-white rounded-[10px] text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Upload a quote
            </Link>
            <Link
              href="/categories"
              className="px-5 py-2.5 border border-neutral-300 text-on-surface rounded-[10px] text-sm font-semibold hover:bg-neutral-50 transition-colors"
            >
              Browse categories
            </Link>
          </div>
        </div>
      </section>

      {/* ── B: Your recent quotes ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant mb-1">
              Your quotes
            </p>
            <h2 className="text-lg font-bold tracking-tight text-on-surface">
              Recently analysed
            </h2>
          </div>
          {quoteCount > 3 && (
            <Link
              href="/my-quotes"
              className="text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap"
            >
              See all {quoteCount} →
            </Link>
          )}
        </div>

        {quoteCount === 0 ? (
          <div className="bg-white rounded-2xl px-6 py-12 text-center space-y-3">
            <p className="text-sm font-semibold text-on-surface">
              You haven&apos;t uploaded a quote yet.
            </p>
            <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
              Upload your first quote and get an AI-powered read in about a minute.
            </p>
            <div className="pt-2">
              <Link
                href="/upload"
                className="inline-block px-5 py-2.5 bg-[#111111] text-white rounded-[10px] text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Upload quote
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentQuotes.map((q) => (
              <DashboardQuoteCard
                key={q.id}
                id={q.id}
                title={q.title}
                subcategoryName={q.subcategory?.name ?? null}
                totalAmount={q.analysis?.totalAmount ?? null}
                createdAt={q.createdAt.toISOString()}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── C: Continue exploring (only if user has uploaded somewhere) ───── */}
      {uploadedInResults.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pb-12">
          <div className="mb-5">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant mb-1">
              Categories you&apos;ve uploaded in
            </p>
            <h2 className="text-lg font-bold tracking-tight text-on-surface">
              Continue exploring
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Compare with more suppliers, or see what to expect in these categories.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedInResults.map(({ top, stats, content }) => (
              <CategoryCard
                key={top.slug}
                topSlug={top.slug}
                topName={top.name}
                subcategoryCount={top.subcategories.length}
                quoteCount={stats?.totalCount ?? 0}
                description={content.description}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── D: Browse by category ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant mb-1">
              Explore
            </p>
            <h2 className="text-lg font-bold tracking-tight text-on-surface">
              Browse by category
            </h2>
          </div>
          <Link
            href="/categories"
            className="text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topCategoryResults.map(({ top, stats, content }) => (
            <CategoryCard
              key={top.slug}
              topSlug={top.slug}
              topName={top.name}
              subcategoryCount={top.subcategories.length}
              quoteCount={stats?.totalCount ?? 0}
              description={content.description}
            />
          ))}
        </div>
      </section>

    </main>
  );
}
