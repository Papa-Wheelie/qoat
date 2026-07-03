import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import UserMenu from "./UserMenu";
import VerificationBanner from "./VerificationBanner";
import NavCategoriesLink from "./NavCategoriesLink";

export default async function Nav() {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  let showVerificationBanner = false;
  let isAdmin = false;
  if (isLoggedIn && session.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true, role: true },
    });
    showVerificationBanner = !user?.emailVerified;
    isAdmin = user?.role === "admin";
  }

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-[20px] border-b border-outline-variant/20"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="text-lg font-extrabold tracking-tighter text-primary"
            >
              QOAT
            </Link>
            <NavCategoriesLink />
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <UserMenu
                name={session.user.name ?? null}
                image={session.user.image ?? null}
                isAdmin={isAdmin}
              />
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
              className="px-4 py-2 bg-[#111111] text-white rounded-[12px] text-sm font-bold hover:opacity-90 active:opacity-80 transition-opacity"
            >
              Upload quote
            </Link>
          </div>
        </div>
        {showVerificationBanner && <VerificationBanner />}
      </nav>
    </>
  );
}
