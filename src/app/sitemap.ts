import { type MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://getqoat.com";

const STATIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "",              priority: 1.0, changeFrequency: "weekly" },
  { path: "/categories",  priority: 0.9, changeFrequency: "weekly" },
  { path: "/faq",         priority: 0.6, changeFrequency: "monthly" },
  { path: "/methodology", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact",     priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms",       priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy",     priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const topCategoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((top) => ({
    url: `${SITE_URL}/categories/${top.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const subCategoryEntries: MetadataRoute.Sitemap = CATEGORIES.flatMap((top) =>
    top.subcategories.map((sub) => ({
      url: `${SITE_URL}/categories/${top.slug}/${sub.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    }))
  );

  return [...staticEntries, ...topCategoryEntries, ...subCategoryEntries];
}
