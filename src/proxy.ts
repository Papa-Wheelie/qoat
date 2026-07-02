import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/methodology",
  "/faq",
  "/contact",
  "/feed",
  "/privacy",
  "/terms",
  "/offline",
];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/quotes/") ||
    pathname.startsWith("/categories/")
  ) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|apple-icon\\.png|manifest\\.json|sw\\.js|icons/).*)",
  ],
};
