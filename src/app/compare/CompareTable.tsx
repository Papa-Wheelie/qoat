"use client";

import { useState } from "react";
import Link from "next/link";
import { formatAUD, formatPublicPrice } from "@/lib/formatPrice";

export type CompareQuote = {
  id: string;
  title: string;
  isOwner: boolean;
  category: { name: string; slug: string };
  suburb: string | null;
  state: string | null;
  publicSummary: string | null;
  totalAmount: number | null;
  lineItemCount: number;
  helpfulCount: number;
  commentCount: number;
  similarCount: number;
  similarAvgPrice: number | null;
  // Owner-only (null if not owner)
  status: string | null;
  priceScore: number | null;
  reputationScore: number | null;
  timeScore: number | null;
  recommendation: string | null;
};

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  pending:  { label: "Pending",  bg: "#E8E8E6", text: "#555555" },
  accepted: { label: "Accepted", bg: "#7DD4C0", text: "#0d3830" },
  rejected: { label: "Rejected", bg: "#F4A7C3", text: "#4a1228" },
};

function qoatScore(q: CompareQuote): number | null {
  if (!q.isOwner || q.priceScore == null || q.reputationScore == null || q.timeScore == null) return null;
  return Math.round((q.priceScore * 0.4 + q.reputationScore * 0.35 + q.timeScore * 0.25) * 10) / 10;
}

function Private() {
  return <span className="text-xs text-on-surface-variant italic">Private</span>;
}

function Cell({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <td
      className={`px-5 py-3.5 text-sm align-top border-b border-outline-variant/10 min-w-[180px] ${
        highlight ? "bg-[#E1F5EE]" : ""
      }`}
    >
      {children}
    </td>
  );
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3.5 text-xs font-semibold tracking-wide text-on-surface-variant uppercase bg-surface-container-lowest border-b border-outline-variant/10 whitespace-nowrap w-36 align-top">
      {children}
    </td>
  );
}

export default function CompareTable({ initialQuotes }: { initialQuotes: CompareQuote[] }) {
  const [quotes, setQuotes] = useState(initialQuotes);

  function handleRemove(id: string) {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center py-24 gap-3">
        <p className="text-on-surface-variant">All quotes removed from comparison.</p>
        <Link href="/" className="text-sm font-semibold text-primary hover:underline underline-offset-2">
          Back to feed
        </Link>
      </div>
    );
  }

  // Compute best values
  const totals = quotes.map((q) => q.totalAmount).filter((t): t is number => t != null);
  const minTotal = totals.length > 0 ? Math.min(...totals) : null;

  const scores = quotes.map((q) => qoatScore(q)).filter((s): s is number => s != null);
  const maxScore = scores.length > 0 ? Math.max(...scores) : null;

  // ── Mobile: stacked cards per quote ─────────────────────────────────────────

  const ROWS: { label: string; render: (q: CompareQuote) => React.ReactNode }[] = [
    {
      label: "Total",
      render: (q) => {
        const isBest = q.totalAmount != null && minTotal != null && q.totalAmount === minTotal && totals.length > 1;
        return (
          <span className={isBest ? "text-[#085041] font-bold" : "font-bold text-primary"}>
            {q.totalAmount != null
              ? q.isOwner
                ? formatAUD(q.totalAmount)
                : formatPublicPrice(q.totalAmount, q.category.slug)
              : "—"}
            {isBest && (
              <span className="ml-2 text-[10px] font-bold text-[#085041] bg-[#C6EBE0] rounded-full px-2 py-0.5">
                Lowest
              </span>
            )}
          </span>
        );
      },
    },
    {
      label: "QOAT Score",
      render: (q) => {
        const s = qoatScore(q);
        const isBest = s != null && maxScore != null && s === maxScore && scores.length > 1;
        if (!q.isOwner) return <Private />;
        if (s == null) return <span className="text-on-surface-variant">—</span>;
        return (
          <span className={isBest ? "font-bold text-[#085041]" : "font-semibold"}>
            {s}/10
            {isBest && (
              <span className="ml-2 text-[10px] font-bold text-[#085041] bg-[#C6EBE0] rounded-full px-2 py-0.5">
                Best
              </span>
            )}
          </span>
        );
      },
    },
    {
      label: "Price",
      render: (q) =>
        q.isOwner ? q.priceScore != null ? `${q.priceScore}/10` : "—" : <Private />,
    },
    {
      label: "Reputation",
      render: (q) =>
        q.isOwner ? q.reputationScore != null ? `${q.reputationScore}/10` : "—" : <Private />,
    },
    {
      label: "Timeline",
      render: (q) =>
        q.isOwner ? q.timeScore != null ? `${q.timeScore}/10` : "—" : <Private />,
    },
    {
      label: "Line Items",
      render: (q) =>
        q.lineItemCount > 0
          ? `${q.lineItemCount} item${q.lineItemCount !== 1 ? "s" : ""}`
          : <span className="text-on-surface-variant">—</span>,
    },
    {
      label: "Helpful",
      render: (q) =>
        q.helpfulCount > 0
          ? `${q.helpfulCount} marked helpful`
          : <span className="text-on-surface-variant">—</span>,
    },
    {
      label: "Similar Quotes",
      render: (q) =>
        q.similarCount > 0 ? (
          <span>
            {q.similarCount} submitted
            {q.similarAvgPrice != null && (
              <> · avg <strong>{formatAUD(q.similarAvgPrice)}</strong></>
            )}
          </span>
        ) : (
          <span className="text-on-surface-variant">—</span>
        ),
    },
    {
      label: "Comments",
      render: (q) =>
        q.commentCount > 0
          ? `${q.commentCount} comment${q.commentCount !== 1 ? "s" : ""}`
          : <span className="text-on-surface-variant">—</span>,
    },
    {
      label: "Status",
      render: (q) => {
        if (!q.isOwner || !q.status) return <Private />;
        const badge = STATUS_BADGE[q.status] ?? STATUS_BADGE.pending;
        return (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: badge.bg, color: badge.text }}
          >
            {badge.label}
          </span>
        );
      },
    },
  ];

  return (
    <>
      {/* ── Mobile layout: one card per quote ─────────────────────────── */}
      <div className="md:hidden space-y-4">
        {quotes.map((q) => (
          <div key={q.id} className="bg-white rounded-[16px] border border-outline-variant/20 overflow-hidden">
            {/* Card header */}
            <div className="px-5 py-4 flex items-start justify-between gap-3 border-b border-outline-variant/10">
              <div className="min-w-0">
                <Link
                  href={`/quotes/${q.id}`}
                  className="font-bold text-sm text-on-surface hover:text-primary transition-colors block leading-snug"
                >
                  {q.title}
                </Link>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {q.category.name}
                  {(q.suburb || q.state) && (
                    <> · {[q.suburb, q.state].filter(Boolean).join(", ")}</>
                  )}
                </p>
                {q.isOwner && (
                  <span className="inline-block mt-1 text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                    Your quote
                  </span>
                )}
              </div>
              {quotes.length > 1 && (
                <button
                  onClick={() => handleRemove(q.id)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-low transition-colors"
                  title="Remove from comparison"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
            {/* Attribute rows */}
            <div className="divide-y divide-outline-variant/10">
              {ROWS.map(({ label, render }) => (
                <div key={label} className="px-5 py-3 flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold tracking-wide uppercase text-on-surface-variant shrink-0">
                    {label}
                  </span>
                  <span className="text-sm text-right">{render(q)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop layout: table ──────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto rounded-[16px] border border-outline-variant/20">
      <table className="w-full border-collapse">
        {/* Column headers */}
        <thead>
          <tr className="bg-white">
            <th className="w-36 border-b border-outline-variant/20" />
            {quotes.map((q) => (
              <th
                key={q.id}
                className="px-5 py-4 text-left font-normal border-b border-outline-variant/20 min-w-[200px] align-top"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/quotes/${q.id}`}
                      className="font-bold text-sm text-on-surface hover:text-primary transition-colors block leading-snug"
                    >
                      {q.title}
                    </Link>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {q.category.name}
                      {(q.suburb || q.state) && (
                        <> · {[q.suburb, q.state].filter(Boolean).join(", ")}</>
                      )}
                    </p>
                    {q.isOwner && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                        Your quote
                      </span>
                    )}
                  </div>
                  {quotes.length > 1 && (
                    <button
                      onClick={() => handleRemove(q.id)}
                      className="shrink-0 text-on-surface-variant hover:text-on-surface transition-colors mt-0.5"
                      title="Remove from comparison"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* Total */}
          <tr className="bg-white hover:bg-surface-container-lowest/50">
            <RowLabel>Total</RowLabel>
            {quotes.map((q) => {
              const isBest = q.totalAmount != null && minTotal != null && q.totalAmount === minTotal && totals.length > 1;
              return (
                <Cell key={q.id} highlight={isBest}>
                  {q.totalAmount != null ? (
                    <span className="font-bold text-primary">
                      {q.isOwner ? formatAUD(q.totalAmount) : formatPublicPrice(q.totalAmount, q.category.slug)}
                    </span>
                  ) : (
                    <span className="text-on-surface-variant">—</span>
                  )}
                  {isBest && (
                    <span className="ml-2 text-[10px] font-bold text-[#085041] bg-[#C6EBE0] rounded-full px-2 py-0.5 align-middle">
                      Lowest
                    </span>
                  )}
                </Cell>
              );
            })}
          </tr>

          {/* QOAT Score */}
          <tr className="bg-white hover:bg-surface-container-lowest/50">
            <RowLabel>QOAT Score</RowLabel>
            {quotes.map((q) => {
              const s = qoatScore(q);
              const isBest = s != null && maxScore != null && s === maxScore && scores.length > 1;
              return (
                <Cell key={q.id} highlight={isBest}>
                  {s != null ? (
                    <span className="font-bold">
                      {s}/10
                      {isBest && (
                        <span className="ml-2 text-[10px] font-bold text-[#085041] bg-[#C6EBE0] rounded-full px-2 py-0.5">
                          Best
                        </span>
                      )}
                    </span>
                  ) : q.isOwner ? (
                    <span className="text-on-surface-variant">—</span>
                  ) : (
                    <Private />
                  )}
                </Cell>
              );
            })}
          </tr>

          {/* Price Score */}
          <tr className="bg-white hover:bg-surface-container-lowest/50">
            <RowLabel>Price</RowLabel>
            {quotes.map((q) => (
              <Cell key={q.id}>
                {q.isOwner
                  ? q.priceScore != null ? `${q.priceScore}/10` : "—"
                  : <Private />}
              </Cell>
            ))}
          </tr>

          {/* Reputation Score */}
          <tr className="bg-white hover:bg-surface-container-lowest/50">
            <RowLabel>Reputation</RowLabel>
            {quotes.map((q) => (
              <Cell key={q.id}>
                {q.isOwner
                  ? q.reputationScore != null ? `${q.reputationScore}/10` : "—"
                  : <Private />}
              </Cell>
            ))}
          </tr>

          {/* Time Score */}
          <tr className="bg-white hover:bg-surface-container-lowest/50">
            <RowLabel>Timeline</RowLabel>
            {quotes.map((q) => (
              <Cell key={q.id}>
                {q.isOwner
                  ? q.timeScore != null ? `${q.timeScore}/10` : "—"
                  : <Private />}
              </Cell>
            ))}
          </tr>

          {/* Line Items */}
          <tr className="bg-white hover:bg-surface-container-lowest/50">
            <RowLabel>Line Items</RowLabel>
            {quotes.map((q) => (
              <Cell key={q.id}>
                {q.lineItemCount > 0 ? (
                  <span>{q.lineItemCount} item{q.lineItemCount !== 1 ? "s" : ""}</span>
                ) : (
                  <span className="text-on-surface-variant">—</span>
                )}
              </Cell>
            ))}
          </tr>

          {/* Community: Helpful */}
          <tr className="bg-white hover:bg-surface-container-lowest/50">
            <RowLabel>Helpful</RowLabel>
            {quotes.map((q) => (
              <Cell key={q.id}>
                {q.helpfulCount > 0 ? `${q.helpfulCount} marked helpful` : <span className="text-on-surface-variant">—</span>}
              </Cell>
            ))}
          </tr>

          {/* Community: Similar Quotes */}
          <tr className="bg-white hover:bg-surface-container-lowest/50">
            <RowLabel>Similar Quotes</RowLabel>
            {quotes.map((q) => (
              <Cell key={q.id}>
                {q.similarCount > 0 ? (
                  <span>
                    {q.similarCount} submitted
                    {q.similarAvgPrice != null && (
                      <> · avg <strong>{formatAUD(q.similarAvgPrice)}</strong></>
                    )}
                  </span>
                ) : (
                  <span className="text-on-surface-variant">—</span>
                )}
              </Cell>
            ))}
          </tr>

          {/* Comments */}
          <tr className="bg-white hover:bg-surface-container-lowest/50">
            <RowLabel>Comments</RowLabel>
            {quotes.map((q) => (
              <Cell key={q.id}>
                {q.commentCount > 0 ? `${q.commentCount} comment${q.commentCount !== 1 ? "s" : ""}` : <span className="text-on-surface-variant">—</span>}
              </Cell>
            ))}
          </tr>

          {/* Status */}
          <tr className="bg-white">
            <RowLabel>Status</RowLabel>
            {quotes.map((q) => (
              <Cell key={q.id}>
                {q.isOwner && q.status ? (() => {
                  const badge = STATUS_BADGE[q.status] ?? STATUS_BADGE.pending;
                  return (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {badge.label}
                    </span>
                  );
                })() : <Private />}
              </Cell>
            ))}
          </tr>
        </tbody>
      </table>
      </div>
    </>
  );
}
