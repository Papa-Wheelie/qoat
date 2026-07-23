"use client";

import { useState } from "react";
import type { FaqItem } from "@/lib/generateCategoryFaqs";

function AccordionItem({
  item,
  isOpen,
  onToggle,
  id,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <div
      className="rounded-[12px] bg-white transition-colors"
      style={{ border: isOpen ? "1px solid #C6C6C6" : "1px solid #ECECE8" }}
    >
      <button
        id={`cfaq-btn-${id}`}
        aria-expanded={isOpen}
        aria-controls={`cfaq-panel-${id}`}
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span className="text-sm font-semibold text-on-surface leading-snug pr-2">
          {item.question}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-on-surface-variant transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          id={`cfaq-panel-${id}`}
          role="region"
          aria-labelledby={`cfaq-btn-${id}`}
        >
          <p
            className="px-5 pb-5 text-sm"
            style={{ color: "#444444", lineHeight: "1.6" }}
          >
            {item.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function CategoryFaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const id = String(i);
        return (
          <AccordionItem
            key={id}
            item={item}
            isOpen={openIds.has(id)}
            onToggle={() => toggle(id)}
            id={id}
          />
        );
      })}
    </div>
  );
}
