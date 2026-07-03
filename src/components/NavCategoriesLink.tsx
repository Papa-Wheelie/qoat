"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavCategoriesLink() {
  const pathname = usePathname();
  const isActive = pathname.startsWith("/categories");

  return (
    <Link
      href="/categories"
      className={`px-3 py-2 text-sm font-semibold transition-colors ${
        isActive
          ? "text-primary underline underline-offset-4"
          : "text-on-surface-variant hover:text-primary"
      }`}
    >
      Categories
    </Link>
  );
}
