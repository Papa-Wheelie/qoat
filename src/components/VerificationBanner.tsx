"use client";

import { useState } from "react";

export default function VerificationBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  if (dismissed) return null;

  async function handleResend() {
    setResending(true);
    await fetch("/api/auth/resend-verification", { method: "POST" });
    setResending(false);
    setResent(true);
  }

  return (
    <div className="bg-[#fef9c3] border-b border-yellow-200 text-[#713f12] text-sm px-6 py-2.5 flex items-center justify-between gap-4">
      <p className="font-medium">
        Please verify your email address. Check your inbox or{" "}
        {resent ? (
          <span className="font-semibold">verification email sent!</span>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity disabled:opacity-50"
          >
            {resending ? "Sending…" : "resend verification"}
          </button>
        )}
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 text-[#713f12]/60 hover:text-[#713f12] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}
