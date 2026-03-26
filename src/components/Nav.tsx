import { auth } from "@/auth";
import Link from "next/link";
import SignOutButton from "./SignOutButton";

export default async function Nav() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-[20px] border-b border-outline-variant/20">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-extrabold tracking-tighter text-primary"
        >
          QOAT
        </Link>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <SignOutButton />
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-[12px] text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
            >
              Sign In
            </Link>
          )}
          <Link
            href="/upload"
            className="px-4 py-2 bg-[#111111] text-white rounded-[12px] text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Submit a Quote
          </Link>
        </div>
      </div>
    </nav>
  );
}
