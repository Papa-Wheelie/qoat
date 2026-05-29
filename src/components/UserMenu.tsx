"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type Props = {
  name: string | null;
  image: string | null;
  isAdmin?: boolean;
};

export default function UserMenu({ name, image, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const display = name?.split(" ")[0] ?? "Account";
  const initial = display[0]?.toUpperCase() ?? "A";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-[12px] text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
      >
        {image ? (
          <img src={image} alt="" width={28} height={28} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <span className="w-7 h-7 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
            {initial}
          </span>
        )}
        <span>{display}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-[12px] border border-outline-variant/30 shadow-lg shadow-black/5 overflow-hidden z-50">
          {[
            { label: "My Quotes", href: "/my-quotes" },
            { label: "Profile", href: "/profile" },
            { label: "Settings", href: "/settings" },
            ...(isAdmin ? [{ label: "Moderation", href: "/admin" }] : []),
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-outline-variant/20" />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-left px-4 py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
