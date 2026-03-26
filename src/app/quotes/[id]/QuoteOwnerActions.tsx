"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Status = "pending" | "accepted" | "rejected";

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string }> = {
  pending:  { label: "Pending",  bg: "#E8E8E6", text: "#555555" },
  accepted: { label: "Accepted", bg: "#7DD4C0", text: "#0d3830" },
  rejected: { label: "Rejected", bg: "#F4A7C3", text: "#4a1228" },
};

function DeleteModal({
  quoteId,
  onClose,
}: {
  quoteId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/my-quotes");
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[16px] p-8 max-w-sm w-full space-y-5 shadow-2xl">
        <h2 className="text-xl font-extrabold tracking-tight text-on-surface">Delete this quote?</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          This will permanently delete the quote and all its data. This cannot be undone.
        </p>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-[12px] text-sm font-semibold text-on-surface-variant border border-outline-variant hover:border-primary hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-[12px] text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuoteOwnerActions({
  quoteId,
  initialStatus,
}: {
  quoteId: string;
  initialStatus: Status;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [showDelete, setShowDelete] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleStatusChange(next: Status) {
    setStatus(next); // optimistic
    await fetch(`/api/quotes/${quoteId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  }

  async function handleReanalyse() {
    setAnalysing(true);
    await fetch(`/api/quotes/${quoteId}/analyse`, { method: "POST" });
    setAnalysing(false);
    router.refresh();
  }

  async function handleShare() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownload() {
    setDownloading(true);
    const res = await fetch(`/api/quotes/${quoteId}/download`);
    setDownloading(false);
    if (!res.ok) return;
    const data = await res.json();
    window.open(data.url, "_blank");
  }

  const ghostBtn =
    "px-3 py-1.5 rounded-[12px] text-xs font-bold border border-[#111111] bg-white text-[#111111] hover:bg-[#111111] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {/* Status pills */}
        <div className="flex gap-2 flex-1">
          <span className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant self-center">Status</span>
          {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => {
            const { label, bg, text } = STATUS_CONFIG[s];
            const active = status === s;
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                style={
                  active
                    ? { backgroundColor: bg, color: text }
                    : { backgroundColor: "transparent", color: "#888888", border: "1px solid #e0e0e0" }
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReanalyse}
            disabled={analysing}
            className={ghostBtn}
          >
            {analysing ? (
              <>
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Analysing…
              </>
            ) : (
              "Re-analyse"
            )}
          </button>

          <button onClick={handleShare} className={ghostBtn}>
            {copied ? "Copied!" : "Copy URL"}
          </button>

          <button onClick={handleDownload} disabled={downloading} className={ghostBtn}>
            {downloading ? "Loading…" : "Download"}
          </button>

          <Link
            href={`/quotes/${quoteId}/edit`}
            className={ghostBtn}
          >
            Edit
          </Link>

          <button
            onClick={() => setShowDelete(true)}
            className="px-3 py-1.5 rounded-[12px] text-xs font-bold border border-red-300 bg-white text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {showDelete && (
        <DeleteModal quoteId={quoteId} onClose={() => setShowDelete(false)} />
      )}
    </>
  );
}
