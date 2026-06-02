"use client";

import { useState } from "react";
import Link from "next/link";

type Comparable = {
  id: string;
  title: string;
  suburb: string | null;
  state: string | null;
  categoryName: string;
  publicTotal: string | null;
  similarityPct: number | null;
};

export default function ComparablesPanel({ quoteId, sampleSize }: { quoteId: string; sampleSize: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comparables, setComparables] = useState<Comparable[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    setOpen(true);
    if (comparables !== null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/comparables`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setComparables(data.comparables);
    } catch {
      setError("Could not load comparables.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        style={{ fontSize: "12px", color: "#888888", display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline", textDecorationColor: "#cccccc" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        Benchmarked against {sampleSize} similar job{sampleSize !== 1 ? "s" : ""}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 py-6"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-[20px] w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">Price benchmarking</p>
                <p className="text-base font-bold text-on-surface mt-0.5">Similar jobs used in scoring</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ color: "#888888", background: "none", border: "none", cursor: "pointer", padding: "4px" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {loading && (
                <p className="text-sm text-on-surface-variant text-center py-8">Loading…</p>
              )}
              {error && (
                <p className="text-sm text-red-600 text-center py-8">{error}</p>
              )}
              {comparables !== null && comparables.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-8">
                  No comparables available — the similar quotes may have been removed.
                </p>
              )}
              {comparables !== null && comparables.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-on-surface-variant pb-1">
                    Prices shown as public ranges. Click any job to view its quote.
                  </p>
                  {comparables.map((c) => (
                    <Link
                      key={c.id}
                      href={`/quotes/${c.id}`}
                      className="block rounded-[12px] px-4 py-4 hover:bg-surface-container-low transition-colors"
                      style={{ backgroundColor: "#F9F9F7" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">{c.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {c.categoryName}
                            {(c.suburb || c.state) && ` · ${[c.suburb, c.state].filter(Boolean).join(", ")}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {c.publicTotal && (
                            <p className="text-sm font-bold text-on-surface">{c.publicTotal}</p>
                          )}
                          {c.similarityPct != null && (
                            <p className="text-xs text-on-surface-variant mt-0.5">{c.similarityPct}% match</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
