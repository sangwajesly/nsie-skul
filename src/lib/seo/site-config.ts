/**
 * Centralized Site and Technical SEO Configuration for Nsei Sukul.
 *
 * Current canonical production domain: https://nsei-sukul.klarifypath.com
 * Domain migration ready: configure NEXT_PUBLIC_SITE_URL when acquiring a dedicated domain.
 * No em dashes are used in this file.
 */

const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "https://nsei-sukul.klarifypath.com";

// Normalize site URL by stripping trailing slash
export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, "");

/**
 * Returns an absolute canonical URL for a given relative or absolute path.
 */
export function getCanonicalUrl(path: string = "/"): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export const SITE_CONFIG = {
  name: "Nsei Sukul",
  legalName: "Nsei Sukul Management System",
  systemTitle: "Management Systems",
  tagline: "School Management, Simplified",
  url: SITE_URL,
  domain: SITE_URL.replace(/^https?:\/\//, ""),

  // Primary SEO descriptions
  defaultTitle: "Nsei Sukul | School Management System in Cameroon",
  titleTemplate: "%s | Nsei Sukul",
  description:
    "Manage your school's students, academic activities, CBA assessments, report cards and finances with Nsei Sukul, a comprehensive school management system designed for secondary schools in Cameroon.",

  // Geographic and language targeting
  locale: "en_CM",
  alternateLocales: ["fr_CM"],
  country: "Cameroon",
  inLanguage: ["en", "fr"],

  // Primary SEO Keywords (English & French)
  keywords: [
    "school management system in Cameroon",
    "school management software in Cameroon",
    "secondary school management system",
    "Cameroon secondary education software",
    "MINESEC report card generation",
    "CBA assessment report card Cameroon",
    "bulletins scolaires Cameroun",
    "gestion scolaire Cameroun",
    "logiciel de gestion scolaire au Cameroun",
    "logiciel de gestion des etablissements secondaires",
    "Anglophone school management system",
    "Francophone school management software",
    "bilingual school management system Cameroon",
    "school fee management software FCFA",
    "offline school management hub",
    "local campus server school software",
  ],

  // Contact and verification
  supportEmail: "contact@nseisukul.com",
  whatsappPhone: "+237682833601",
  whatsappUrl: "https://wa.me/237682833601",
  currency: "XAF",

  // Verification codes (read from environment variables)
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "",
  },

  // Analytics
  gaId: process.env.NEXT_PUBLIC_GA_ID || "",
} as const;
