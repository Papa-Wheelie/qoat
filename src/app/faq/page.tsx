import { type Metadata } from "next";
import Link from "next/link";
import { groupedFaq } from "@/lib/faq";
import FaqAccordion from "./FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ — QOAT",
  description: "Common questions about QOAT, how it works, and how we handle your data.",
};

export default function FaqPage() {
  const groups = groupedFaq();

  return (
    <main className="min-h-screen bg-surface pt-14 py-16 px-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-12">

        {/* Header */}
        <header className="space-y-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
            Support
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">
            Frequently asked questions
          </h1>
          <p className="text-on-surface-variant leading-relaxed max-w-lg">
            Common questions about QOAT, how it works, and how we handle your data.
          </p>
        </header>

        {/* Accordion */}
        <FaqAccordion groups={groups} />

        {/* CTA */}
        <div className="bg-white rounded-[16px] px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-on-surface">Can&apos;t find what you&apos;re looking for?</p>
            <p className="text-sm text-on-surface-variant mt-0.5">We&apos;re happy to help with any question.</p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline whitespace-nowrap"
          >
            Contact us
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Back */}
        <div className="pb-4">
          <Link href="/" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">
            ← Back to home
          </Link>
        </div>

      </div>
    </main>
  );
}
