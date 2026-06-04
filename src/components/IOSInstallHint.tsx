"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "qoat_ios_hint_dismissed";

function isIOSSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  // Exclude Chrome and other browsers on iOS (they show their own prompts)
  const isSafari = /^((?!CriOS|FxiOS|OPiOS|EdgiOS).)*Safari/.test(ua);
  return isIOS && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export default function IOSInstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isIOSSafari()) return;
    if (isStandalone()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Small delay so it doesn't flash on first paint
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 px-4 pb-6"
      style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="bg-white rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-outline-variant/20 px-5 py-4 flex items-start gap-4">
        {/* QOAT wordmark */}
        <div className="w-10 h-10 rounded-[10px] bg-[#111111] flex items-center justify-center shrink-0">
          <span className="text-white font-extrabold text-base tracking-tight">Q</span>
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-bold text-on-surface">Add QOAT to your Home Screen</p>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Tap the{" "}
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline-block align-middle mx-0.5"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>{" "}
            share button below, then tap <strong>Add to Home Screen</strong>.
          </p>
        </div>

        <button
          onClick={dismiss}
          className="shrink-0 w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
