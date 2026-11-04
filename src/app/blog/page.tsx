import { Metadata } from "next";
import { MarketingHeader } from "@/components/landing/MarketingHeader";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { BlogIndexClient } from "./BlogIndexClient";
import { BreadcrumbJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Articles & Pedagogic Guides",
  description:
    "Authoritative pedagogical guides for Cameroon secondary school teachers, Class Masters, and Principals. MINESEC CBA compliance, report cards, logbooks, and school administration.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Articles & Pedagogic Guides | Nsei Sukul",
    description:
      "Essential guides on MINESEC Competency-Based Approach (CBA/APC), report card compilation, Class Council deliberations, and school leadership in Cameroon.",
    type: "website",
    locale: "en_CM",
    url: "/blog",
  },
};

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] text-[#142010] antialiased">
      <MarketingHeader currentPath="/blog" />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Articles & Pedagogic Guides", path: "/blog" },
        ]}
      />

      <main className="flex-1 pb-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <BlogIndexClient />
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
