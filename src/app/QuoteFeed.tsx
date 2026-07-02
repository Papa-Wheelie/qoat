"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { formatPublicPrice } from "@/lib/formatPrice";
import { useCompareSelection } from "@/lib/useCompareSelection";
import CompareBar from "@/components/CompareBar";

type Category = { slug: string; name: string };
export type SortOption = "newest" | "oldest" | "price-high" | "price-low" | "most-helpful" | "most-discussed";

const SORT_LABELS: Record<SortOption, string> = {
  newest:           "Newest",
  oldest:           "Oldest",
  "price-high":     "Price: High to Low",
  "price-low":      "Price: Low to High",
  "most-helpful":   "Most Helpful",
  "most-discussed": "Most Discussed",
};

export type FeedQuote = {
  id: string;
  userId: string;
  title: string;
  hidden: boolean;
  isSeed: boolean;
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

type Props = {
  initialQuotes: FeedQuote[];
  initialTotalPages: number;
  initialTotalCount: number;
  categories: Category[];
  currentUserId: string | null;
  isPrivileged: boolean;
  initialSearch: string;
  initialSort: SortOption;
  initialCategory: string | null;
  initialState: string;
};

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  if (score == null) return null;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container-low text-on-surface-variant">
      {label} {score}
    </span>
  );
}

type QuoteCardProps = {
  quote: FeedQuote;
  currentUserId: string | null;
  isSelected: boolean;
  atMax: boolean;
  onToggle: () => void;
};

function QuoteCard({ quote, currentUserId, isSelected, atMax, onToggle }: QuoteCardProps) {
  const isOwner = !!currentUserId && quote.userId === currentUserId;
  const disableCheck = !isSelected && atMax;

  return (
    <div className={`relative rounded-[12px] bg-white border transition-colors group ${
      isSelected ? "border-primary ring-1 ring-primary/20" : "border-outline-variant/30 hover:border-primary/40"
    }`}>
      {/* Checkbox — outside the Link, stop propagation not needed */}
      <div className="absolute top-3 right-3 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          disabled={disableCheck}
          title={disableCheck ? "Select up to 4 quotes to compare" : "Select to compare"}
          className="w-[18px] h-[18px] cursor-pointer disabled:cursor-not-allowed accent-[#111111]"
        />
      </div>

      <Link href={`/quotes/${quote.id}`} className="block p-5 pr-10">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-1">
              {quote.category.name}
              {(quote.suburb || quote.state) && (
                <span className="font-normal normal-case tracking-normal">
                  {" · "}{[quote.suburb, quote.state].filter(Boolean).join(", ")}
                </span>
              )}
              {quote.isSeed && (
                <span className="inline-flex items-center rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600 tracking-wide normal-case ml-2 align-middle">
                  Reference
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
            {!quote.analysisComplete ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#FFF3CD", color: "#856404" }}>
                Analysing…
              </span>
            ) : (
              <>
                <ScoreBadge score={quote.priceScore} label="Price" />
                <ScoreBadge score={quote.reputationScore} label="Rep" />
                <ScoreBadge score={quote.timeScore} label="Time" />
              </>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1 flex-wrap">
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
            {quote.helpfulCount > 0 && (
              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
                {quote.helpfulCount}
              </span>
            )}
            {quote.similarCount > 0 && (
              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {quote.similarCount}
              </span>
            )}
            {quote.hidden && (
              <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 whitespace-nowrap">
                <span className="hidden sm:inline">Hidden by moderation</span>
                <span className="sm:hidden">Hidden</span>
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function QuoteFeed({
  initialQuotes,
  initialTotalPages,
  initialTotalCount,
  categories,
  currentUserId,
  isPrivileged,
  initialSearch,
  initialSort,
  initialCategory,
  initialState,
}: Props) {
  const [quotes, setQuotes] = useState<FeedQuote[]>(initialQuotes);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);
  const [activeState, setActiveState] = useState<string>(initialState);
  const [sortOrder, setSortOrder] = useState<SortOption>(initialSort);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [includeHidden, setIncludeHidden] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist includeHidden toggle in sessionStorage for privileged users
  useEffect(() => {
    if (!isPrivileged) return;
    const stored = sessionStorage.getItem("qoat_include_hidden");
    if (stored === "true") setIncludeHidden(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { selected, toggle, remove, clear } = useCompareSelection();
  const atMax = selected.length >= 4;

  const hasActiveFilters = !!(searchInput || activeCategory || activeState || sortOrder !== "newest");

  function updateURL(category: string | null, state: string, search: string, sort: SortOption) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (state) params.set("state", state);
    if (search) params.set("search", search);
    if (sort !== "newest") params.set("sort", sort);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  async function fetchQuotes(
    category: string | null,
    state: string,
    search: string,
    sort: SortOption,
    pageNum: number,
    append = false,
    withHidden = includeHidden
  ) {
    if (!append) setFiltering(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (state) params.set("state", state);
      if (search) params.set("search", search);
      if (sort !== "newest") params.set("sort", sort);
      if (pageNum > 1) params.set("page", String(pageNum));
      if (withHidden) params.set("includeHidden", "true");

      const res = await fetch(`/api/quotes?${params}`);
      const data = await res.json();

      if (append) {
        setQuotes((prev) => [...prev, ...data.quotes]);
      } else {
        setQuotes(data.quotes);
      }
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } finally {
      setFiltering(false);
      setLoadingMore(false);
    }
  }

  // On mount: apply URL filter params if non-default
  useEffect(() => {
    if (initialSearch || initialSort !== "newest" || initialCategory || initialState) {
      fetchQuotes(initialCategory, initialState, initialSearch, initialSort, 1);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchQuotes(activeCategory, activeState, value, sortOrder, 1);
      updateURL(activeCategory, activeState, value, sortOrder);
    }, 300);
  }

  function handleCategoryChange(slug: string | null) {
    setActiveCategory(slug);
    fetchQuotes(slug, activeState, searchInput, sortOrder, 1);
    updateURL(slug, activeState, searchInput, sortOrder);
  }

  function handleStateChange(state: string) {
    setActiveState(state);
    fetchQuotes(activeCategory, state, searchInput, sortOrder, 1);
    updateURL(activeCategory, state, searchInput, sortOrder);
  }

  function handleSortChange(sort: SortOption) {
    setSortOrder(sort);
    fetchQuotes(activeCategory, activeState, searchInput, sort, 1);
    updateURL(activeCategory, activeState, searchInput, sort);
  }

  async function handleLoadMore() {
    await fetchQuotes(activeCategory, activeState, searchInput, sortOrder, page + 1, true, includeHidden);
  }

  function handleIncludeHiddenToggle(checked: boolean) {
    setIncludeHidden(checked);
    sessionStorage.setItem("qoat_include_hidden", checked ? "true" : "false");
    fetchQuotes(activeCategory, activeState, searchInput, sortOrder, 1, false, checked);
  }

  function handleClearAll() {
    setSearchInput("");
    setActiveCategory(null);
    setActiveState("");
    setSortOrder("newest");
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    fetchQuotes(null, "", "", "newest", 1, false, includeHidden);
    window.history.replaceState(null, "", window.location.pathname);
  }

  const pillBase = "px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer";
  const pillActive = "bg-[#111111] text-white";
  const pillInactive = "bg-surface text-on-surface hover:bg-surface-container-low";

  return (
    <>
      <div className={`space-y-4 ${selected.length > 0 ? "pb-20" : ""}`}>
        {/* Row 1: Search + Sort */}
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by job type, suburb, or keyword…"
              className="w-full bg-white border border-outline-variant rounded-[12px] pl-10 pr-9 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                aria-label="Clear search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <select
            value={sortOrder}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="shrink-0 bg-white border border-outline-variant rounded-[12px] px-3 py-2.5 text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          {isPrivileged && (
            <label className="shrink-0 flex items-center gap-2 cursor-pointer select-none" title="Show hidden quotes (admin/moderator only)">
              <div
                onClick={() => handleIncludeHiddenToggle(!includeHidden)}
                className={`relative w-8 h-4.5 rounded-full transition-colors ${includeHidden ? "bg-red-500" : "bg-outline-variant"}`}
                style={{ width: 32, height: 18 }}
              >
                <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${includeHidden ? "translate-x-[14px]" : "translate-x-0.5"}`} />
              </div>
              <span className="text-xs font-semibold text-on-surface-variant hidden sm:inline">
                Include hidden
              </span>
            </label>
          )}
        </div>

        {/* Row 2: Category pills + state */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button onClick={() => handleCategoryChange(null)} className={`${pillBase} ${activeCategory === null ? pillActive : pillInactive}`}>All</button>
            {categories.map((c) => (
              <button key={c.slug} onClick={() => handleCategoryChange(c.slug)} className={`${pillBase} ${activeCategory === c.slug ? pillActive : pillInactive}`}>
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
            {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Result count + clear */}
        <div className="flex items-center justify-between min-h-[20px]">
          <p className="text-xs text-on-surface-variant">
            {filtering ? "Searching…" : `${totalCount.toLocaleString()} ${totalCount === 1 ? "quote" : "quotes"}`}
          </p>
          {hasActiveFilters && !filtering && (
            <button onClick={handleClearAll} className="text-xs font-semibold text-primary hover:underline underline-offset-2 transition-colors">
              Clear all
            </button>
          )}
        </div>

        {/* Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity duration-150 ${filtering ? "opacity-40 pointer-events-none" : ""}`}>
          {quotes.length === 0 && !filtering ? (
            <div className="col-span-2 flex flex-col items-center py-24 gap-4">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant/30">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p className="text-on-surface-variant font-medium text-sm">No quotes match your search.</p>
              <p className="text-xs text-on-surface-variant">Try different keywords or clear your filters.</p>
              <button onClick={handleClearAll} className="px-5 py-2.5 bg-[#111111] text-white rounded-[12px] text-sm font-bold hover:opacity-90 transition-opacity">
                Clear filters
              </button>
            </div>
          ) : (
            quotes.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                currentUserId={currentUserId}
                isSelected={selected.some((s) => s.id === q.id)}
                atMax={atMax}
                onToggle={() => toggle({ id: q.id, title: q.title })}
              />
            ))
          )}
        </div>

        {/* Load more */}
        {page < totalPages && !filtering && (
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

      <CompareBar selected={selected} onRemove={remove} onClear={clear} />
    </>
  );
}
