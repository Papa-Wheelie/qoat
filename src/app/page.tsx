"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="fixed top-4 right-4 flex items-center gap-3">
        <Link
          href="/upload"
          className="bg-surface-container-lowest border border-outline-variant text-on-surface px-4 py-2 rounded-[12px] text-sm font-semibold hover:border-primary transition-colors"
        >
          Submit a Quote
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="bg-primary text-on-primary px-4 py-2 rounded-[12px] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Sign Out
        </button>
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-medium text-gray-900">QOAT</h1>
        <p className="mt-2 text-gray-500">
          Quality Of All Things — get your quotes validated by AI and the community.
        </p>
      </div>
    </main>
  );
}
