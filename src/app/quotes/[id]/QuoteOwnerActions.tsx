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
  const [status, setStatus] = useState<Status>(initialStatus);
  const [showDelete, setShowDelete] = useState(false);

  async function handleStatusChange(next: Status) {
    setStatus(next); // optimistic
    await fetch(`/api/quotes/${quoteId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  }

  return (
    <>
      {/* Status selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">Status</span>
        <div className="flex gap-2">
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
      </div>

      {/* Edit / Delete links */}
      <div className="flex items-center gap-4">
        <Link
          href={`/quotes/${quoteId}/edit`}
          className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
        >
          Edit
        </Link>
        <button
          onClick={() => setShowDelete(true)}
          className="text-sm font-medium text-on-surface-variant hover:text-red-600 transition-colors"
        >
          Delete
        </button>
      </div>

      {showDelete && (
        <DeleteModal quoteId={quoteId} onClose={() => setShowDelete(false)} />
      )}
    </>
  );
}
