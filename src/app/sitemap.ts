import { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/data/blog-posts";
import { getCanonicalUrl } from "@/lib/seo/site-config";

/**
 * Dynamic XML Sitemap for Nsei Sukul.
 * Serves canonical URLs for search engines at /sitemap.xml.
 * Excludes private dashboard, auth, and API routes.
 * No em dashes used.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Core public marketing pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: getCanonicalUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: getCanonicalUrl("/features/school-hub"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: getCanonicalUrl("/features/report-cards"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: getCanonicalUrl("/features/finance"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: getCanonicalUrl("/blog"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: getCanonicalUrl("/terms"),
      lastModified: new Date("2026-10-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: getCanonicalUrl("/privacy"),
      lastModified: new Date("2026-10-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamic editorial blog articles
  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => {
    let lastModifiedDate = now;
    try {
      const parsed = new Date(post.publishDate);
      if (!isNaN(parsed.getTime())) {
        lastModifiedDate = parsed;
      }
    } catch {
      lastModifiedDate = now;
    }

    return {
      url: getCanonicalUrl(`/blog/${post.slug}`),
      lastModified: lastModifiedDate,
      changeFrequency: "monthly",
      priority: 0.7,
    };
  });

  return [...staticRoutes, ...blogRoutes];
}
