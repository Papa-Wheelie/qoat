"use client";

import { useState } from "react";
import Link from "next/link";

export type ReportData = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { name: string | null; email: string };
  resolvedBy: { name: string | null } | null;
  quote: { id: string; title: string; hidden: boolean } | null;
  comment: { id: string; content: string; hidden: boolean; quoteId: string } | null;
};

type ActionState = "idle" | "loading" | "done" | "error";

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  misleading: "Misleading",
  inappropriate: "Inappropriate",
  duplicate: "Duplicate",
  other: "Other",
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: "#E8E8E6", text: "#555", label: "Pending" },
  dismissed: { bg: "#E8E8E6", text: "#555", label: "Dismissed" },
  actioned:  { bg: "#C6EBE0", text: "#085041", label: "Actioned" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function ReportRow({ report: initialReport }: { report: ReportData }) {
  const [report, setReport] = useState(initialReport);
  const [state, setState] = useState<ActionState>("idle");

  async function doAction(action: "hide" | "unhide" | "dismiss") {
    setState("loading");
    try {
      const res = await fetch(`/api/admin/reports/${report.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) { setState("error"); return; }
      const data = await res.json();
      setReport((prev) => ({
        ...prev,
        status: data.status,
        resolvedAt: data.resolvedAt,
        quote: data.quote ?? prev.quote,
        comment: data.comment ?? prev.comment,
      }));
      setState("done");
    } catch {
      setState("error");
    }
  }

  const target = report.quote
    ? { label: "Quote", link: `/quotes/${report.quote.id}`, text: report.quote.title, hidden: report.quote.hidden }
    : report.comment
    ? { label: "Comment", link: `/quotes/${report.comment.quoteId}`, text: report.comment.content.slice(0, 100), hidden: report.comment.hidden }
    : null;

  const badge = STATUS_BADGE[report.status] ?? STATUS_BADGE.pending;

  return (
    <div className="bg-white rounded-[12px] border border-outline-variant/20 px-5 py-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-on-surface">{target?.label ?? "Unknown"}</span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: badge.bg, color: badge.text }}
            >
              {badge.label}
            </span>
            {target?.hidden && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                Hidden
              </span>
            )}
            <span className="text-xs text-on-surface-variant font-semibold bg-surface-container-low px-2 py-0.5 rounded-full">
              {REASON_LABELS[report.reason] ?? report.reason}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Reported by {report.reporter.name ?? report.reporter.email} · {timeAgo(report.createdAt)}
            {report.resolvedAt && report.resolvedBy && (
              <> · Resolved by {report.resolvedBy.name ?? "admin"}</>
            )}
          </p>
        </div>
      </div>

      {/* Target content */}
      {target && (
        <div className="bg-surface-container-lowest rounded-[8px] px-4 py-3">
          <Link href={target.link} className="text-xs font-semibold text-primary hover:underline underline-offset-2 block mb-1">
            View {target.label.toLowerCase()} →
          </Link>
          <p className="text-sm text-on-surface line-clamp-2">{target.text}</p>
        </div>
      )}

      {/* Reporter details */}
      {report.details && (
        <p className="text-xs text-on-surface-variant italic">&ldquo;{report.details}&rdquo;</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap pt-1">
        {target && !target.hidden && (
          <button
            onClick={() => doAction("hide")}
            disabled={state === "loading"}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
          >
            {state === "loading" ? "…" : `Hide ${target.label.toLowerCase()}`}
          </button>
        )}
        {target?.hidden && (
          <button
            onClick={() => doAction("unhide")}
            disabled={state === "loading"}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-low disabled:opacity-40 transition-colors"
          >
            {state === "loading" ? "…" : "Unhide"}
          </button>
        )}
        {report.status === "pending" && (
          <button
            onClick={() => doAction("dismiss")}
            disabled={state === "loading"}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Dismiss
          </button>
        )}
        {state === "error" && (
          <span className="text-xs text-red-500">Something went wrong</span>
        )}
      </div>
    </div>
  );
}

export default function ReportList({ reports }: { reports: ReportData[] }) {
  const [filter, setFilter] = useState<"all" | "pending">("pending");

  const visible = filter === "pending" ? reports.filter((r) => r.status === "pending") : reports;

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["pending", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
              filter === f
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            {f === "pending" ? `Pending (${reports.filter((r) => r.status === "pending").length})` : "All"}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-on-surface-variant text-sm py-8 text-center">
          {filter === "pending" ? "No pending reports." : "No reports yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <ReportRow key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}
