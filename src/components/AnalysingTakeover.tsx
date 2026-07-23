"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type AnalysisStatus = "pending" | "extracting" | "scoring" | "complete" | "failed";

const STAGE_PROGRESS: Record<AnalysisStatus, number> = {
  pending:    8,
  extracting: 33,
  scoring:    66,
  complete:   100,
  failed:     0,
};

type StageConfig = { heading: string; sub: string };

const STAGE_CONFIG: Record<AnalysisStatus, StageConfig> = {
  pending: {
    heading: "Reading your quote…",
    sub: "We're extracting line items, supplier details, and pricing from your document.",
  },
  extracting: {
    heading: "Reading your quote…",
    sub: "We're extracting line items, supplier details, and pricing from your document.",
  },
  scoring: {
    heading: "Scoring your iron triangle…",
    sub: "Comparing your quote against Australian market benchmarks and similar jobs in QOAT.",
  },
  complete: {
    heading: "Almost done…",
    sub: "Finalising your analysis.",
  },
  failed: {
    heading: "Analysis failed",
    sub: "Something went wrong processing your quote.",
  },
};

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 30; // 60 seconds

type Props = {
  quoteId: string;
  initialStatus: AnalysisStatus;
};

export default function AnalysingTakeover({ quoteId, initialStatus }: Props) {
  const [status, setStatus] = useState<AnalysisStatus>(initialStatus);
  const [pollCount, setPollCount] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  useEffect(() => {
    if (initialStatus === "complete" || initialStatus === "failed") return;

    function poll() {
      pollCountRef.current += 1;
      setPollCount(pollCountRef.current);

      if (pollCountRef.current >= MAX_POLLS) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimedOut(true);
        return;
      }

      fetch(`/api/quotes/${quoteId}/status`)
        .then((r) => r.json())
        .then((data: { analysisStatus?: AnalysisStatus }) => {
          const s = data.analysisStatus ?? "pending";
          setStatus(s);
          if (s === "complete" || s === "failed") {
            if (timerRef.current) clearInterval(timerRef.current);
            // Slight delay so the progress bar can hit 100% visually
            setTimeout(() => { window.location.reload(); }, 600);
          }
        })
        .catch(() => {});
    }

    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [quoteId, initialStatus]);

  const progress = STAGE_PROGRESS[status] ?? 8;
  const config = STAGE_CONFIG[status] ?? STAGE_CONFIG.pending;

  const steps: { label: string; status: AnalysisStatus }[] = [
    { label: "Reading document", status: "extracting" },
    { label: "Benchmarking price", status: "scoring" },
    { label: "Scoring iron triangle", status: "scoring" },
  ];

  const ORDER: AnalysisStatus[] = ["pending", "extracting", "scoring", "complete"];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "#F9F9F7" }}
    >
      {/* QOAT wordmark */}
      <div className="px-6 pt-6">
        <span className="text-base font-extrabold tracking-tight text-on-surface">QOAT</span>
      </div>

      {/* Centred content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm space-y-8">

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="h-1 rounded-full overflow-hidden bg-outline-variant/20">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #7DD4C0 0%, #89CFF0 50%, #F4A7C3 100%)",
                }}
              />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">
              {config.heading}
            </h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {config.sub}
            </p>
          </div>

          {/* Timing hint */}
          {!timedOut && (
            <p className="text-xs text-on-surface-variant/60">
              Usually takes about 15 seconds
            </p>
          )}

          {/* Timed-out state */}
          {timedOut && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-on-surface-variant">
                Taking longer than usual…
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#111111] text-white rounded-[10px] text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Reload
              </button>
            </div>
          )}

          {/* Step checklist — shown after a few polls */}
          {pollCount >= 2 && !timedOut && (
            <div className="space-y-2 pt-2">
              {steps.map((step) => {
                const stepIdx = ORDER.indexOf(step.status);
                const currentIdx = ORDER.indexOf(status);
                const done = currentIdx > stepIdx;
                const active = currentIdx === stepIdx;

                return (
                  <div key={step.label} className="flex items-center gap-2.5">
                    {done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7DD4C0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : active ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-primary/40 border-t-primary animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-outline-variant/30 shrink-0" />
                    )}
                    <span
                      className="text-xs"
                      style={{ color: done ? "#444444" : active ? "#111111" : "#AAAAAA", fontWeight: done || active ? 500 : 400 }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Failed state (rendered separately by the page) ───────────────────────────

export function AnalysisFailed({ quoteId }: { quoteId: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#F9F9F7" }}>
      <div className="w-full max-w-sm space-y-5 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="font-bold text-on-surface">Analysis failed</p>
          <p className="text-sm text-on-surface-variant">
            Something went wrong while processing your quote.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={async () => {
              await fetch(`/api/quotes/${quoteId}/analyse`, { method: "POST" });
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-[#111111] text-white rounded-[10px] text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Try re-analysing
          </button>
          <Link href="/browse" className="text-sm text-on-surface-variant underline underline-offset-2 hover:text-on-surface transition-colors">
            Browse quotes
          </Link>
        </div>
      </div>
    </div>
  );
}
