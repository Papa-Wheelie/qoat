import { notFound } from "next/navigation";
import { type Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCategoryStats } from "@/lib/categoryStats";
import { getSubcategoryContent } from "@/lib/subcategoryContent";
import { formatAUD } from "@/lib/formatPrice";
import PriceDistributionChart from "./PriceDistributionChart";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subSlug: string }>;
}): Promise<Metadata> {
  const { subSlug } = await params;
  const stats = await getCategoryStats(subSlug);
  if (!stats) return { title: "Not found — QOAT" };
  return {
    title: `${stats.subName} pricing — QOAT`,
    description: `Real Australian ${stats.subName.toLowerCase()} quotes — price ranges, benchmarks, and what to ask suppliers.`,
  };
}

// ── Small inline Card wrapper ─────────────────────────────────────────────────

function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl px-6 py-6 space-y-4">
      {title && (
        <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function Page({
  params,
}: {
  params: Promise<{ subSlug: string }>;
}) {
  const { subSlug } = await params;

  const stats = await getCategoryStats(subSlug);
  if (!stats) notFound();

  const content = getSubcategoryContent(subSlug);

  // Look up DB subcategory ID for the recent quotes query
  const dbSub = await prisma.subcategory.findUnique({
    where: { slug: subSlug },
    select: { id: true },
  });

  const recentQuotes = dbSub
    ? await prisma.quote.findMany({
        where: { subcategoryId: dbSub.id, hidden: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          state: true,
          isSeed: true,
          analysis: { select: { totalAmount: true, qualityTier: true } },
        },
      })
    : [];

  const { price } = stats;

  return (
    <main className="min-h-screen bg-surface pt-14">
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-24 space-y-8">

        {/* ── Section 1: Hero header ────────────────────────────────────── */}
        <section className="space-y-3 pb-2">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
            {stats.topName}
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">
            {stats.subName}
          </h1>
          <p className="text-on-surface-variant leading-relaxed max-w-lg text-sm">
            {content.description}
          </p>
          {price && (
            <p className="text-sm text-on-surface-variant pt-1">
              <span className="text-on-surface font-semibold">
                {formatAUD(price.min)} – {formatAUD(price.max)}
              </span>{" "}
              typical range · median{" "}
              <span className="text-on-surface font-semibold">
                {formatAUD(price.median)}
              </span>{" "}
              · based on {stats.totalCount} quote{stats.totalCount !== 1 ? "s" : ""}
            </p>
          )}
        </section>

        {/* ── Section 2: Price distribution ────────────────────────────── */}
        <section>
          {stats.hasEnoughData && stats.distribution.length > 0 && price ? (
            <Card title="Price distribution">
              <PriceDistributionChart
                distribution={stats.distribution}
                median={price.median}
              />
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-on-surface-variant">
                We have <span className="font-semibold text-on-surface">{stats.totalCount}</span> quote{stats.totalCount !== 1 ? "s" : ""} for {stats.subName.toLowerCase()}. Full distribution appears once we reach 10 or more.
              </p>
            </Card>
          )}
        </section>

        {/* ── Section 3: What drives the price ─────────────────────────── */}
        <section>
          <Card title="What drives the price">
            <ul className="space-y-2">
              {content.priceDrivers.map((driver) => (
                <li key={driver} className="flex gap-2 text-sm" style={{ color: "#444444" }}>
                  <span className="shrink-0 mt-0.5" style={{ color: "#888888" }}>—</span>
                  <span>{driver}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* ── Section 4: Common line items ──────────────────────────────── */}
        {stats.commonLineItems.length > 0 && (
          <section>
            <Card title="Common line items">
              <div className="divide-y divide-neutral-100">
                {stats.commonLineItems.map((item) => (
                  <div
                    key={item.description}
                    className="flex justify-between items-baseline gap-4 py-2 first:pt-0 last:pb-0"
                  >
                    <span className="text-sm" style={{ color: "#444444" }}>
                      {item.description}
                    </span>
                    <span className="text-sm font-semibold text-on-surface shrink-0">
                      {formatAUD(item.medianAmount)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-on-surface-variant pt-1">
                Typical amounts based on quotes in this category. Items appearing in 3+ quotes shown.
              </p>
            </Card>
          </section>
        )}

        {/* ── Section 5: Regional breakdown ────────────────────────────── */}
        {stats.stateDistribution.length > 0 && (
          <section>
            <Card title="Where these quotes come from">
              <div className="space-y-1.5">
                {stats.stateDistribution.map(({ state, count }) => (
                  <div key={state} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-on-surface w-10">{state}</span>
                    <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: "#7DD4C0",
                          width: `${Math.round((count / stats.totalCount) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-on-surface-variant w-16 text-right">
                      {count} quote{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}

        {/* ── Section 6: Questions to ask ──────────────────────────────── */}
        <section>
          <Card title="Questions to ask suppliers">
            <ol className="space-y-2 list-decimal list-inside">
              {content.questionsToAsk.map((q) => (
                <li key={q} className="text-sm leading-relaxed" style={{ color: "#444444" }}>
                  {q}
                </li>
              ))}
            </ol>
          </Card>
        </section>

        {/* ── Section 7: Permits and compliance ────────────────────────── */}
        <section>
          <Card title="Permits and compliance">
            <p className="text-sm leading-relaxed" style={{ color: "#444444" }}>
              {content.permitNotes}
            </p>
            <p className="text-xs text-on-surface-variant">
              Guidance only — confirm with your local council or licensed trade.
            </p>
          </Card>
        </section>

        {/* ── Section 8: Recent quotes ──────────────────────────────────── */}
        {recentQuotes.length > 0 && (
          <section>
            <Card title="Recent quotes">
              <div className="divide-y divide-neutral-100">
                {recentQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {q.state && (
                        <span className="text-xs font-medium text-on-surface-variant bg-neutral-100 px-2 py-0.5 rounded-full shrink-0">
                          {q.state}
                        </span>
                      )}
                      {q.analysis?.qualityTier && (
                        <span className="text-xs text-on-surface-variant capitalize truncate">
                          {q.analysis.qualityTier} tier
                        </span>
                      )}
                      {q.isSeed && (
                        <span className="inline-flex items-center rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-600 tracking-wide shrink-0">
                          Reference
                        </span>
                      )}
                    </div>
                    {q.analysis?.totalAmount && (
                      <span className="text-sm font-semibold text-on-surface shrink-0">
                        {formatAUD(q.analysis.totalAmount)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}

        {/* ── Section 9: Community placeholder ─────────────────────────── */}
        <section>
          <div className="bg-white rounded-2xl px-6 py-4">
            <p className="text-sm text-on-surface-variant">
              Community discussion coming soon.
            </p>
          </div>
        </section>

        {/* ── Section 10: CTA ──────────────────────────────────────────── */}
        <section className="text-center space-y-4 pt-4">
          <h2 className="text-2xl font-bold tracking-tight text-primary">
            Got a {stats.subName.toLowerCase()} quote?
          </h2>
          <p className="text-on-surface-variant text-sm">
            Upload it and we&apos;ll check if it&apos;s fair.
          </p>
          <Link
            href="/upload"
            className="inline-block bg-primary text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Upload quote
          </Link>
        </section>

      </div>
    </main>
  );
}
