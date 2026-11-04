import React from "react";
import { SITE_CONFIG, getCanonicalUrl } from "./site-config";

/**
 * Organization structured data (JSON-LD)
 */
export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_CONFIG.url}/#organization`,
    name: SITE_CONFIG.name,
    legalName: SITE_CONFIG.legalName,
    url: SITE_CONFIG.url,
    logo: getCanonicalUrl("/icons/icon-512.svg"),
    description: SITE_CONFIG.description,
    address: {
      "@type": "PostalAddress",
      addressCountry: "CM",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE_CONFIG.whatsappPhone,
      contactType: "customer service",
      areaServed: "CM",
      availableLanguage: ["English", "French"],
    },
    sameAs: [
      SITE_CONFIG.whatsappUrl,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * WebSite structured data (JSON-LD)
 */
export function WebSiteJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_CONFIG.url}/#website`,
    url: SITE_CONFIG.url,
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    inLanguage: ["en-CM", "fr-CM"],
    publisher: {
      "@id": `${SITE_CONFIG.url}/#organization`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * SoftwareApplication structured data (JSON-LD)
 */
export function SoftwareApplicationJsonLd({
  name = "Nsei Sukul",
  description = SITE_CONFIG.description,
  featureList = [
    "MINESEC 6-Sequence Assessment Engine",
    "Automated CBA Competency Report Card Generation",
    "Offline Campus LAN Hub Server",
    "FCFA School Fee & Bursary Tracking",
    "Student & Teacher Directories",
  ],
}: {
  name?: string;
  description?: string;
  featureList?: string[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    applicationCategory: "EducationalApplication",
    applicationSubCategory: "School Management System",
    operatingSystem: "Web, Windows, macOS, Linux, Android",
    url: SITE_CONFIG.url,
    description,
    featureList,
    inLanguage: ["en", "fr"],
    countryOfOrigin: {
      "@type": "Country",
      name: "Cameroon",
    },
    publisher: {
      "@id": `${SITE_CONFIG.url}/#organization`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/**
 * BreadcrumbList structured data (JSON-LD)
 */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  authorRole?: string;
  category?: string;
  image?: string;
}

/**
 * Article / BlogPosting structured data (JSON-LD)
 */
export function ArticleJsonLd({
  title,
  description,
  url,
  datePublished,
  dateModified,
  authorName,
  authorRole,
  category,
  image,
}: ArticleJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": getCanonicalUrl(url),
    },
    url: getCanonicalUrl(url),
    image: image ? getCanonicalUrl(image) : getCanonicalUrl("/icons/icon-512.svg"),
    datePublished,
    dateModified: dateModified || datePublished,
    inLanguage: "en-CM",
    articleSection: category,
    author: {
      "@type": "Person",
      name: authorName,
      jobTitle: authorRole || "Educator",
    },
    publisher: {
      "@id": `${SITE_CONFIG.url}/#organization`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
