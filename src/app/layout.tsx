import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { FloatingPwaInstallPrompt } from "@/components/pwa/FloatingPwaInstallPrompt";
import { SITE_CONFIG } from "@/lib/seo/site-config";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/lib/seo/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#142010",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: SITE_CONFIG.defaultTitle,
    template: SITE_CONFIG.titleTemplate,
  },
  description: SITE_CONFIG.description,
  keywords: [...SITE_CONFIG.keywords],
  authors: [{ name: "Nsei Sukul Pedagogic Team" }],
  creator: "Nsei Sukul",
  publisher: "Nsei Sukul",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      "en-CM": "/",
      "fr-CM": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: SITE_CONFIG.locale,
    alternateLocale: [...SITE_CONFIG.alternateLocales],
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.description,
    images: [
      {
        url: "/screenshots/desktop-overview.png",
        width: 1200,
        height: 630,
        alt: "Nsei Sukul - School Management Platform for Cameroon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.description,
    images: ["/screenshots/desktop-overview.png"],
  },
  verification: {
    google: SITE_CONFIG.verification.google || undefined,
    other: SITE_CONFIG.verification.bing
      ? { "msvalidate.01": SITE_CONFIG.verification.bing }
      : undefined,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/app-icon.png", sizes: "256x256", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/app-icon.png", sizes: "256x256", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_CONFIG.name,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="256x256" href="/app-icon.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <PwaProvider>
          {children}
          <FloatingPwaInstallPrompt />
        </PwaProvider>

        {SITE_CONFIG.gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${SITE_CONFIG.gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${SITE_CONFIG.gaId}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true
                });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
