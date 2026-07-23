import { notFound } from "next/navigation";
import { type Metadata } from "next";
import Link from "next/link";
import { getTopCategoryStats } from "@/lib/categoryStats";
import { getSubcategoryContent, getTopCategoryContent } from "@/lib/subcategoryContent";
import { formatAUD } from "@/lib/formatPrice";
import CategoryBreadcrumb from "@/components/CategoryBreadcrumb";
import { StructuredData } from "@/components/StructuredData";

const SITE_URL = "https://getqoat.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topSlug: string }>;
}): Promise<Metadata> {
  const { topSlug } = await params;
  const stats = await getTopCategoryStats(topSlug);
  if (!stats) return { title: "Not found — QOAT" };

  const year = new Date().getFullYear();
  const canonical = `${SITE_URL}/categories/${topSlug}`;
  const title = `${stats.topName} costs in Australia — pricing guide ${year} | QOAT`;
  const description = `${stats.topName} pricing across ${stats.subSummaries.length} sub-categories. Compare typical costs, see what drives price, and check your own quote against real Australian market data.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: "article", url: canonical, siteName: "QOAT" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ topSlug: string }>;
}) {
  const { topSlug } = await params;

  const stats = await getTopCategoryStats(topSlug);
  if (!stats) notFound();

  const topContent = getTopCategoryContent(topSlug);

  const breadcrumbLD = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Categories", item: `${SITE_URL}/categories` },
      { "@type": "ListItem", position: 2, name: stats.topName, item: `${SITE_URL}/categories/${topSlug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-surface pt-14">
      <StructuredData data={breadcrumbLD} />
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-24 space-y-10">

        {/* Breadcrumb */}
        <CategoryBreadcrumb topSlug={topSlug} topName={stats.topName} />

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="space-y-3 pb-2">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
            <Link href="/categories" className="hover:text-on-surface transition-colors">
              Categories
            </Link>
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">
            {stats.topName}
          </h1>
          <p className="text-on-surface-variant leading-relaxed max-w-lg text-sm">
            {topContent.description}
          </p>
          <p className="text-sm text-on-surface-variant">
            {stats.subSummaries.length} sub-categories ·{" "}
            <span className="text-on-surface font-semibold">{stats.totalCount}</span> quotes analysed
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

        {/* ── Sub-category grid ─────────────────────────────────────────── */}
        <section>
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-4">
            Sub-categories
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.subSummaries.map((sub) => {
              const subContent = getSubcategoryContent(sub.subSlug);
              return (
                <Link
                  key={sub.subSlug}
                  href={`/categories/${topSlug}/${sub.subSlug}`}
                  className="group bg-white rounded-2xl px-5 py-5 space-y-3 hover:shadow-sm transition-shadow block"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-on-surface leading-snug">
                      {sub.subName}
                    </h3>
                    <span className="text-on-surface-variant group-hover:text-on-surface transition-colors shrink-0 mt-0.5">
                      ›
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                    {subContent.description}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {sub.hasEnoughData && sub.priceMin != null && sub.priceMax != null ? (
                      <>
                        {sub.totalCount} quotes ·{" "}
                        <span className="text-on-surface font-medium">
                          {formatAUD(sub.priceMin)} – {formatAUD(sub.priceMax)}
                        </span>{" "}
                        typical
                      </>
                    ) : (
                      <>
                        {sub.totalCount} quote{sub.totalCount !== 1 ? "s" : ""} ·{" "}
                        <span className="text-on-surface-variant italic">Building data</span>
                      </>
                    )}
                  </p>
                </Link>
              );
            })}
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
