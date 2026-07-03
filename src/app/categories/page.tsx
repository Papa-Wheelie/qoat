import { type Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { getTopCategoryStats } from "@/lib/categoryStats";
import { getTopCategoryContent } from "@/lib/subcategoryContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse trade categories — QOAT",
  description:
    "QOAT tracks pricing across trade, building and supplier categories in Australia. Explore what to expect before you buy.",
};

export default async function Page() {
  const results = await Promise.all(
    CATEGORIES.map(async (top) => {
      const stats = await getTopCategoryStats(top.slug);
      const content = getTopCategoryContent(top.slug);
      return { top, stats, content };
    })
  );

  const totalQuotes = results.reduce(
    (acc, r) => acc + (r.stats?.totalCount ?? 0),
    0
  );
  const totalSubs = CATEGORIES.reduce(
    (acc, top) => acc + top.subcategories.length,
    0
  );

  return (
    <main className="min-h-screen bg-surface pt-14">
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-24 space-y-10">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="space-y-3 pb-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">
            Browse by category
          </h1>
          <p className="text-on-surface-variant leading-relaxed max-w-lg text-sm">
            QOAT tracks pricing across trade, building and supplier categories
            in Australia. Explore what to expect before you buy.
          </p>
          <p className="text-sm text-on-surface-variant">
            {CATEGORIES.length} categories ·{" "}
            {totalSubs} sub-categories ·{" "}
            <span className="text-on-surface font-semibold">{totalQuotes}</span> quotes analysed
          </p>
          <div className="pt-2">
            <Link
              href="/upload"
              className="inline-block bg-primary text-white text-sm font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity"
            >
              Know if your quote is fair
            </Link>
          </div>
        </section>

        {/* ── Category grid ─────────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(({ top, stats, content }) => (
              <Link
                key={top.slug}
                href={`/categories/${top.slug}`}
                className="group bg-white rounded-2xl px-5 py-5 space-y-3 hover:shadow-sm transition-shadow block"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-on-surface leading-snug">
                    {top.name}
                  </h3>
                  <span className="text-on-surface-variant group-hover:text-on-surface transition-colors shrink-0 mt-0.5">
                    ›
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                  {content.description}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {top.subcategories.length} sub-categories ·{" "}
                  <span className="text-on-surface font-medium">
                    {stats?.totalCount ?? 0}
                  </span>{" "}
                  quotes
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Closing CTA ──────────────────────────────────────────────── */}
        <section className="text-center space-y-3 pt-4">
          <h2 className="text-xl font-semibold tracking-tight text-on-surface">
            Ready to check your quote?
          </h2>
          <p className="text-on-surface-variant text-sm">
            Upload it and get an honest read in about a minute.
          </p>
          <Link
            href="/upload"
            className="inline-block border border-neutral-300 text-on-surface text-sm font-semibold px-6 py-3 rounded-xl hover:bg-neutral-50 transition-colors"
          >
            Upload quote
          </Link>
        </section>

      </div>
    </main>
  );
}
