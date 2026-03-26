"use client";

import { useState } from "react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="px-3 py-1.5 rounded-[12px] text-xs font-bold border border-[#111111] bg-white text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
    >
      {copied ? "Copied!" : "Copy URL"}
    </button>
  );
}
