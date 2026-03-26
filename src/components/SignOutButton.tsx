"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="px-4 py-2 rounded-[12px] text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
    >
      Sign Out
    </button>
  );
}
