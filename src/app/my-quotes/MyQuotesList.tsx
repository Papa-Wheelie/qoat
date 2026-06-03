"use client";

import Link from "next/link";
import { formatAUD } from "@/lib/formatPrice";
import { useCompareSelection } from "@/lib/useCompareSelection";
import CompareBar from "@/components/CompareBar";

export type MyQuoteData = {
  id: string;
  title: string;
  status: string;
  hidden: boolean;
  suburb: string | null;
  state: string | null;
  createdAt: string;
  category: { name: string; slug: string };
  totalAmount: number | null;
  priceScore: number | null;
  reputationScore: number | null;
  timeScore: number | null;
  voteCount: number;
  commentCount: number;
  helpfulCount: number;
  similarCount: number;
  analysisComplete: boolean;
};

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

export default function MyQuotesList({ quotes }: { quotes: MyQuoteData[] }) {
  const { selected, toggle, remove, clear } = useCompareSelection();
  const atMax = selected.length >= 4;

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center py-24 gap-4">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-on-surface-variant/30">
          <rect x="10" y="8" width="36" height="44" rx="3" stroke="currentColor" strokeWidth="2.5"/>
          <line x1="18" y1="20" x2="38" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="18" y1="28" x2="38" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="18" y1="36" x2="28" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p className="text-on-surface-variant font-medium">You haven&apos;t submitted any quotes yet.</p>
        <Link href="/upload" className="px-5 py-2.5 bg-[#111111] text-white rounded-[12px] text-sm font-bold hover:opacity-90 transition-opacity">
          Submit your first quote
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${selected.length > 0 ? "pb-20" : ""}`}>
        {quotes.map((q) => {
          const isSelected = selected.some((s) => s.id === q.id);
          const disableCheck = !isSelected && atMax;
          const badge = STATUS_BADGE[q.status] ?? STATUS_BADGE.pending;

          return (
            <div
              key={q.id}
              className={`relative rounded-[12px] bg-white border transition-colors group ${
                isSelected ? "border-primary ring-1 ring-primary/20" : "border-outline-variant/30 hover:border-primary/40"
              }`}
            >
              {/* Checkbox */}
              <div className="absolute top-3 right-3 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle({ id: q.id, title: q.title })}
                  disabled={disableCheck}
                  title={disableCheck ? "Select up to 4 quotes to compare" : "Select to compare"}
                  className="w-[18px] h-[18px] cursor-pointer disabled:cursor-not-allowed accent-[#111111]"
                />
              </div>

              <Link href={`/quotes/${q.id}`} className="block p-5 pr-10">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-1">
                      {q.category.name}
                      {(q.suburb || q.state) && (
                        <span className="font-normal normal-case tracking-normal">
                          {" · "}{[q.suburb, q.state].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </p>
                    <p className="font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                      {q.title}
                    </p>
                  </div>

                  {q.totalAmount != null && (
                    <p className="text-xl font-extrabold tracking-tight text-primary">
                      {formatAUD(q.totalAmount)}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {!q.analysisComplete ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#FFF3CD", color: "#856404" }}>
                        Analysing…
                      </span>
                    ) : (
                      <>
                        <ScoreBadge score={q.priceScore} label="Price" />
                        <ScoreBadge score={q.reputationScore} label="Rep" />
                        <ScoreBadge score={q.timeScore} label="Time" />
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-1 flex-wrap">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                      </svg>
                      {q.voteCount}
                    </span>
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      {q.commentCount}
                    </span>
                    {q.helpfulCount > 0 && (
                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                        {q.helpfulCount}
                      </span>
                    )}
                    {q.similarCount > 0 && (
                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        {q.similarCount}
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-1.5">
                      {q.hidden && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 whitespace-nowrap">
                          <span className="hidden sm:inline">Hidden by moderation</span>
                          <span className="sm:hidden">Hidden</span>
                        </span>
                      )}
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      <CompareBar selected={selected} onRemove={remove} onClear={clear} />
    </>
  );
}
