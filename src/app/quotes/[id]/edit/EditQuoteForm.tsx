"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

type Category = { id: string; name: string };

type Props = {
  quoteId: string;
  initial: {
    title: string;
    categoryId: string;
    suburb: string;
    state: string;
    description: string;
  };
  categories: Category[];
};

export default function EditQuoteForm({ quoteId, initial, categories }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [suburb, setSuburb] = useState(initial.suburb);
  const [state, setState] = useState(initial.state);
  const [description, setDescription] = useState(initial.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch(`/api/quotes/${quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, categoryId, suburb, state, description }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save");
      return;
    }

    router.push(`/quotes/${quoteId}`);
  }

  const inputClass =
    "w-full bg-surface-container-lowest border border-outline-variant rounded-[12px] p-4 text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all";
  const labelClass =
    "block text-sm font-semibold tracking-wide text-primary/70 uppercase px-1 mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className={labelClass}>Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="category" className={labelClass}>Category</label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={inputClass}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="suburb" className={labelClass}>Suburb</label>
          <input
            id="suburb"
            type="text"
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
            placeholder="e.g. Surry Hills"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="state" className={labelClass}>State</label>
          <select
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className={inputClass}
          >
            <option value="">Select state</option>
            {AU_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Any additional context about the quote…"
          className={`${inputClass} resize-none`}
        />
      </div>

      {error && <p className="text-sm text-error font-medium px-1">{error}</p>}

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-[#111111] text-white rounded-[12px] text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <Link
          href={`/quotes/${quoteId}`}
          className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
