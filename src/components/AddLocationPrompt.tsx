"use client";

import { useState } from "react";

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const inputClass =
  "bg-white border border-[#E8C97A] rounded-[10px] px-3 py-2 text-sm text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-[#E8C97A] focus:border-[#E8C97A] outline-none transition-all";

type Props = {
  quoteId: string;
};

export default function AddLocationPrompt({ quoteId }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (dismissed) return null;

  async function handleDismiss() {
    setDismissed(true);
    await fetch(`/api/quotes/${quoteId}/dismiss-location-prompt`, { method: "POST" });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!suburb.trim() && !state) return;
    setError("");
    setSaving(true);

    const res = await fetch(`/api/quotes/${quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suburb: suburb.trim(), state }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Couldn't save location.");
      setSaving(false);
      return;
    }

    // Trigger re-analysis in background then reload
    fetch(`/api/quotes/${quoteId}/analyse`, { method: "POST" }).catch(() => {});
    window.location.reload();
  }

  return (
    <div
      className="rounded-[12px] px-5 py-4 space-y-3"
      style={{ backgroundColor: "#FAEEDA", border: "1px solid #F0D9A8" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-bold" style={{ color: "#633806" }}>
            Add a location for better benchmarking
          </p>
          <p className="text-xs" style={{ color: "#7A4510" }}>
            We couldn&apos;t find a job location on your quote. Adding it helps us compare prices in your area.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors mt-0.5"
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSave} className="flex flex-wrap gap-2 items-end">
        <input
          type="text"
          value={suburb}
          onChange={(e) => setSuburb(e.target.value)}
          placeholder="Suburb"
          className={`${inputClass} flex-1 min-w-[120px]`}
        />
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className={`${inputClass} w-24`}
        >
          <option value="">State</option>
          {AU_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving || (!suburb.trim() && !state)}
          className="px-4 py-2 rounded-[10px] text-sm font-bold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "#856404" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>

      {error && (
        <p className="text-xs font-medium" style={{ color: "#791F1F" }}>{error}</p>
      )}
    </div>
  );
}
