"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPublicPrice } from "@/lib/formatPrice";

type Category = { id: string; name: string; slug: string };

export type FeedQuote = {
  id: string;
  userId: string;
  title: string;
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
};

type Props = {
  initialQuotes: FeedQuote[];
  initialTotalPages: number;
  categories: Category[];
  currentUserId: string | null;
};

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];


type ScoreBadgeProps = { score: number | null; bg: string; label: string };
function ScoreBadge({ score, bg, label }: ScoreBadgeProps) {
  if (score == null) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant">
        Pending
      </span>
    );
  }
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ backgroundColor: bg, color: "#111111" }}
    >
      {label} {score}/10
    </span>
  );
}

function QuoteCard({ quote, currentUserId }: { quote: FeedQuote; currentUserId: string | null }) {
  const isOwner = !!currentUserId && quote.userId === currentUserId;
  return (
    <Link
      href={`/quotes/${quote.id}`}
      className="block bg-white rounded-[12px] border border-outline-variant/30 p-5 hover:border-primary/40 transition-colors group"
    >
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-1">
            {quote.category.name}
            {(quote.suburb || quote.state) && (
              <span className="font-normal normal-case tracking-normal">
                {" · "}
                {[quote.suburb, quote.state].filter(Boolean).join(", ")}
              </span>
            )}
          </p>
          <p className="font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">
            {quote.title}
          </p>
        </div>

        {quote.totalAmount != null && (
          <p className="text-xl font-extrabold tracking-tight text-primary">
            {isOwner
              ? new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(quote.totalAmount)
              : formatPublicPrice(quote.totalAmount, quote.category.slug)}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          <ScoreBadge score={quote.priceScore} bg="#7DD4C0" label="Price" />
          <ScoreBadge score={quote.reputationScore} bg="#F4A7C3" label="Rep" />
          <ScoreBadge score={quote.timeScore} bg="#89CFF0" label="Time" />
        </div>

        <div className="flex items-center gap-4 pt-1">
          <span className="text-xs text-on-surface-variant flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
            {quote.voteCount}
          </span>
          <span className="text-xs text-on-surface-variant flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {quote.commentCount}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="col-span-2 flex flex-col items-center py-24 gap-4">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-on-surface-variant/30">
        <rect x="10" y="8" width="36" height="44" rx="3" stroke="currentColor" strokeWidth="2.5"/>
        <line x1="18" y1="20" x2="38" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="18" y1="28" x2="38" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="18" y1="36" x2="28" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="46" cy="46" r="9" stroke="currentColor" strokeWidth="2.5"/>
        <line x1="52.5" y1="52.5" x2="58" y2="58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <p className="text-on-surface-variant font-medium">No quotes yet. Be the first to submit one.</p>
      <Link
        href="/upload"
        className="px-5 py-2.5 bg-[#111111] text-white rounded-[12px] text-sm font-bold hover:opacity-90 transition-opacity"
      >
        Submit a Quote
      </Link>
    </div>
  );
}

export default function QuoteFeed({ initialQuotes, initialTotalPages, categories, currentUserId }: Props) {
  const [quotes, setQuotes] = useState<FeedQuote[]>(initialQuotes);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeState, setActiveState] = useState<string>("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtering, setFiltering] = useState(false);

  async function fetchQuotes(category: string | null, state: string, pageNum: number, append = false) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (state) params.set("state", state);
    if (pageNum > 1) params.set("page", String(pageNum));

    const res = await fetch(`/api/quotes?${params}`);
    const data = await res.json();

    if (append) {
      setQuotes((prev) => [...prev, ...data.quotes]);
    } else {
      setQuotes(data.quotes);
    }
    setPage(data.page);
    setTotalPages(data.totalPages);
  }

  async function handleCategoryChange(slug: string | null) {
    setActiveCategory(slug);
    setFiltering(true);
    await fetchQuotes(slug, activeState, 1);
    setFiltering(false);
  }

  async function handleStateChange(state: string) {
    setActiveState(state);
    setFiltering(true);
    await fetchQuotes(activeCategory, state, 1);
    setFiltering(false);
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    await fetchQuotes(activeCategory, activeState, page + 1, true);
    setLoadingMore(false);
  }

  const pillBase = "px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer";
  const pillActive = "bg-[#111111] text-white";
  const pillInactive = "bg-surface text-on-surface hover:bg-surface-container-low";

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`${pillBase} ${activeCategory === null ? pillActive : pillInactive}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => handleCategoryChange(c.slug)}
              className={`${pillBase} ${activeCategory === c.slug ? pillActive : pillInactive}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <select
          value={activeState}
          onChange={(e) => handleStateChange(e.target.value)}
          className="shrink-0 bg-surface border border-outline-variant rounded-[10px] px-3 py-1.5 text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All States</option>
          {AU_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${filtering ? "opacity-50" : "opacity-100"}`}>
        {quotes.length === 0 ? (
          <EmptyState />
        ) : (
          quotes.map((q) => <QuoteCard key={q.id} quote={q} currentUserId={currentUserId} />)
        )}
      </div>

      {/* Load more */}
      {page < totalPages && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-3 border border-outline-variant rounded-[12px] text-sm font-semibold text-on-surface hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more quotes"}
          </button>
        </div>
      )}
    </div>
  );
}
