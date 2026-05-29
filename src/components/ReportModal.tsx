"use client";

import { useState } from "react";

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "misleading", label: "Misleading or false information" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "duplicate", label: "Duplicate post" },
  { value: "other", label: "Other" },
];

type Props = {
  quoteId?: string;
  commentId?: string;
  onClose: () => void;
};

export default function ReportModal({ quoteId, commentId, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error" | "already">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setState("loading");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, commentId, reason, details: details || undefined }),
      });
      if (res.status === 409) { setState("already"); return; }
      if (!res.ok) { setState("error"); return; }
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-[16px] w-full max-w-sm shadow-xl">
        <div className="px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between">
          <h2 className="text-base font-bold text-on-surface">Report {quoteId ? "Quote" : "Comment"}</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {state === "done" ? (
          <div className="px-6 py-8 text-center space-y-3">
            <p className="text-sm text-on-surface font-semibold">Thanks for your report.</p>
            <p className="text-xs text-on-surface-variant">Our moderation team will review it shortly.</p>
            <button onClick={onClose} className="mt-2 text-sm font-semibold text-primary hover:underline">
              Close
            </button>
          </div>
        ) : state === "already" ? (
          <div className="px-6 py-8 text-center space-y-3">
            <p className="text-sm text-on-surface">You&apos;ve already reported this.</p>
            <button onClick={onClose} className="mt-2 text-sm font-semibold text-primary hover:underline">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Reason</legend>
              {REASONS.map((r) => (
                <label key={r.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-on-surface">{r.label}</span>
                </label>
              ))}
            </fieldset>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Additional details <span className="normal-case font-normal">(optional)</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Any other context…"
                className="w-full border border-outline-variant/40 rounded-[8px] px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 resize-none focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            {state === "error" && (
              <p className="text-xs text-red-500">Something went wrong. Please try again.</p>
            )}

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!reason || state === "loading"}
                className="px-4 py-1.5 rounded-full text-sm font-semibold bg-primary text-white disabled:opacity-40 transition-opacity"
              >
                {state === "loading" ? "Sending…" : "Submit report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
