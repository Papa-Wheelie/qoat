import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import CompareTable, { type CompareQuote } from "./CompareTable";
import { formatAUD } from "@/lib/formatPrice";

export const metadata = { title: "Compare Quotes — QOAT", robots: { index: false, follow: false } };

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids: idsParam } = await searchParams;
  const ids = (idsParam ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);

  if (ids.length === 0) notFound();

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const [quotes, similarGroups] = await Promise.all([
    prisma.quote.findMany({
      where: { id: { in: ids } },
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
    similarGroups.map((g) => [g.quoteId, { avgPrice: g._avg.price }])
  );

  const compareQuotes: CompareQuote[] = ids
    .map((id) => {
      const q = quotes.find((q) => q.id === id);
      if (!q) return null;
      const isOwner = q.userId === userId;
      const lineItemCount = Array.isArray(q.analysis?.lineItems)
        ? (q.analysis.lineItems as unknown[]).length
        : 0;
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
        similarAvgPrice: similarByQuoteId.get(q.id)?.avgPrice ?? null,
        status: isOwner ? q.status : null,
        priceScore: isOwner ? (q.analysis?.priceScore ?? null) : null,
        reputationScore: isOwner ? (q.analysis?.reputationScore ?? null) : null,
        timeScore: isOwner ? (q.analysis?.timeScore ?? null) : null,
        recommendation: isOwner ? (q.analysis?.recommendation ?? null) : null,
      } satisfies CompareQuote;
    })
    .filter((q): q is CompareQuote => q != null);

  if (compareQuotes.length === 0) notFound();

  // Price range for summary
  const totals = compareQuotes.map((q) => q.totalAmount).filter((t): t is number => t != null);
  const minTotal = totals.length > 0 ? Math.min(...totals) : null;
  const maxTotal = totals.length > 0 ? Math.max(...totals) : null;

  return (
    <main className="min-h-screen bg-surface pt-14 py-16 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to feed
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            Compare Quotes
          </h1>
          <p className="text-on-surface-variant">
            {compareQuotes.length} quote{compareQuotes.length !== 1 ? "s" : ""}
            {minTotal != null && maxTotal != null && minTotal !== maxTotal && (
              <> · price range {formatAUD(minTotal)} – {formatAUD(maxTotal)}</>
            )}
          </p>
        </header>

        {/* Privacy notice for mixed views */}
        {compareQuotes.some((q) => !q.isOwner) && (
          <div className="bg-surface-container-low rounded-[12px] px-5 py-3 flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">Scores and status are private</strong> for quotes you don&apos;t own. You&apos;re seeing public information only for those quotes.
            </p>
          </div>
        )}

        {/* Comparison table */}
        <CompareTable initialQuotes={compareQuotes} />

        {/* Public summaries */}
        {compareQuotes.some((q) => q.publicSummary) && (
          <section className="space-y-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
              AI Summaries
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {compareQuotes.filter((q) => q.publicSummary).map((q) => (
                <div key={q.id} className="bg-surface-container-lowest rounded-[12px] px-5 py-4 space-y-1.5">
                  <Link href={`/quotes/${q.id}`} className="text-xs font-semibold text-on-surface hover:text-primary transition-colors line-clamp-1">
                    {q.title}
                  </Link>
                  <p className="text-sm text-on-surface leading-relaxed">{q.publicSummary}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
