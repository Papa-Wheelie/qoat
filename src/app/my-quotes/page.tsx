import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatAUD } from "@/lib/formatPrice";

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  pending:  { label: "Pending",  bg: "#E8E8E6", text: "#555555" },
  accepted: { label: "Accepted", bg: "#7DD4C0", text: "#0d3830" },
  rejected: { label: "Rejected", bg: "#F4A7C3", text: "#4a1228" },
};

function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  if (score == null) return null;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container-low text-on-surface-variant">
      {label} {score}
    </span>
  );
}

export default async function MyQuotesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const quotes = await prisma.quote.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      suburb: true,
      state: true,
      createdAt: true,
      category: { select: { name: true, slug: true } },
      analysis: {
        select: { totalAmount: true, priceScore: true, reputationScore: true, timeScore: true },
      },
      _count: { select: { votes: true, comments: true, helpfulMarks: true, similarQuotes: true } },
    },
  });

  return (
    <main className="min-h-screen bg-surface pt-14 py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">My Quotes</h1>
            <p className="mt-1 text-on-surface-variant">{quotes.length} quote{quotes.length !== 1 ? "s" : ""} submitted</p>
          </header>

          {quotes.length === 0 ? (
            <div className="flex flex-col items-center py-24 gap-4">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-on-surface-variant/30">
                <rect x="10" y="8" width="36" height="44" rx="3" stroke="currentColor" strokeWidth="2.5"/>
                <line x1="18" y1="20" x2="38" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="18" y1="28" x2="38" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="18" y1="36" x2="28" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p className="text-on-surface-variant font-medium">You haven&apos;t submitted any quotes yet.</p>
              <Link
                href="/upload"
                className="px-5 py-2.5 bg-[#111111] text-white rounded-[12px] text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Submit your first quote
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quotes.map((q) => (
                <Link
                  key={q.id}
                  href={`/quotes/${q.id}`}
                  className="block bg-white rounded-[12px] border border-outline-variant/30 p-5 hover:border-primary/40 transition-colors group"
                >
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-1">
                        {q.category.name}
                        {(q.suburb || q.state) && (
                          <span className="font-normal normal-case tracking-normal">
                            {" · "}
                            {[q.suburb, q.state].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </p>
                      <p className="font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                        {q.title}
                      </p>
                    </div>

                    {q.analysis?.totalAmount != null && (
                      <p className="text-xl font-extrabold tracking-tight text-primary">
                        {formatAUD(q.analysis.totalAmount)}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      <ScoreBadge score={q.analysis?.priceScore ?? null} label="Price" />
                      <ScoreBadge score={q.analysis?.reputationScore ?? null} label="Rep" />
                      <ScoreBadge score={q.analysis?.timeScore ?? null} label="Time" />
                    </div>

                    <div className="flex items-center gap-3 pt-1 flex-wrap">
                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                        {q._count.votes}
                      </span>
                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        {q._count.comments}
                      </span>
                      {q._count.helpfulMarks > 0 && (
                        <span className="text-xs text-on-surface-variant flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                          </svg>
                          {q._count.helpfulMarks}
                        </span>
                      )}
                      {q._count.similarQuotes > 0 && (
                        <span className="text-xs text-on-surface-variant flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                          {q._count.similarQuotes}
                        </span>
                      )}
                      {(() => {
                        const badge = STATUS_BADGE[q.status] ?? STATUS_BADGE.pending;
                        return (
                          <span
                            className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ backgroundColor: badge.bg, color: badge.text }}
                          >
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
  );
}
