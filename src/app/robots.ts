import { MetadataRoute } from "next";
import { getCanonicalUrl } from "@/lib/seo/site-config";

/**
 * Dynamic robots.txt handler for Nsei Sukul.
 * Serves instructions at /robots.txt.
 * Controls search crawler indexing and references sitemap.xml.
 * No em dashes used.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/features/",
          "/blog/",
          "/terms",
          "/privacy",
          "/_next/static/",
          "/_next/image/",
          "/icons/",
          "/screenshots/",
        ],
        disallow: [
          "/dashboard/",
          "/api/",
          "/auth/",
          "/login",
          "/register",
          "/forgot-password",
          "/onboarding",
          "/select-school",
          "/verify",
          "/offline",
        ],
      },
    ],
    sitemap: getCanonicalUrl("/sitemap.xml"),
  };
}
