"use client";

import { useState, useEffect } from "react";

export type SelectedQuote = { id: string; title: string };

const SESSION_KEY = "qoat_compare";

export function useCompareSelection() {
  const [selected, setSelected] = useState<SelectedQuote[]>([]);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) setSelected(JSON.parse(raw));
    } catch {}
  }, []);

  function persist(items: SelectedQuote[]) {
    setSelected(items);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(items));
    } catch {}
  }

  function toggle(quote: SelectedQuote) {
    setSelected((prev) => {
      const exists = prev.some((q) => q.id === quote.id);
      const next = exists
        ? prev.filter((q) => q.id !== quote.id)
        : prev.length < 4
        ? [...prev, quote]
        : prev; // at max — silently ignore
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function remove(id: string) {
    persist(selected.filter((q) => q.id !== id));
  }

  function clear() {
    persist([]);
  }

  return { selected, toggle, remove, clear };
}
