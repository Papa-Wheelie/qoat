"use client";

import { useRouter } from "next/navigation";
import type { SelectedQuote } from "@/lib/useCompareSelection";

type Props = {
  selected: SelectedQuote[];
  onRemove: (id: string) => void;
  onClear: () => void;
};

export default function CompareBar({ selected, onRemove, onClear }: Props) {
  const router = useRouter();

  if (selected.length === 0) return null;

  function handleCompare() {
    router.push(`/compare?ids=${selected.map((q) => q.id).join(",")}`);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-outline-variant shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
        <span className="text-sm font-semibold text-on-surface shrink-0">
          {selected.length} selected
        </span>

        {/* Chips */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-none min-w-0">
          {selected.map((q) => (
            <div
              key={q.id}
              className="flex items-center gap-1.5 bg-surface-container rounded-[8px] px-3 py-1.5 shrink-0"
            >
              <span className="text-xs text-on-surface max-w-[140px] truncate">{q.title}</span>
              <button
                onClick={() => onRemove(q.id)}
                className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
                aria-label={`Remove ${q.title}`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onClear}
            className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleCompare}
            disabled={selected.length < 2}
            className="px-5 py-2 bg-[#111111] text-white text-sm font-bold rounded-[10px] hover:opacity-90 disabled:opacity-40 transition-all"
          >
            Compare{selected.length >= 2 ? ` (${selected.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
