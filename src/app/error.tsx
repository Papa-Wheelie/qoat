"use client";

import Link from "next/link";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-surface pt-14 flex flex-col items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary">Something went wrong</h1>
        <p className="text-on-surface-variant">An unexpected error occurred.</p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#111111] text-white rounded-[12px] text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-outline-variant rounded-[12px] text-sm font-semibold text-on-surface hover:border-primary hover:text-primary transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
