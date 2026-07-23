import { type MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://getqoat.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/upload",
        "/my-quotes",
        "/profile",
        "/settings",
        "/admin",
        "/compare",
        "/browse",
        "/quotes/",
        "/offline",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
