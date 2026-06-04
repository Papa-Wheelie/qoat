"use client";

export default function OfflineClient() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="w-full px-6 py-3 bg-[#111111] text-white rounded-[12px] font-bold text-sm hover:opacity-90 active:opacity-80 transition-opacity"
    >
      Try again
    </button>
  );
}
