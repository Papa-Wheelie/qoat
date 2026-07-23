import Link from "next/link";
import type { Metadata } from "next";
import OfflineClient from "./OfflineClient";

export const metadata: Metadata = {
  title: "You're offline — QOAT",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm space-y-6">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-on-surface-variant"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>

        {/* Brand */}
        <p className="text-lg font-extrabold tracking-tight text-primary">QOAT</p>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">
            You&apos;re offline
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            QOAT needs an internet connection to load quotes and analysis. Check your connection and try again.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <OfflineClient />
          <Link
            href="/"
            className="block text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
