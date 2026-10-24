import Link from "next/link";
import { type ReactNode } from "react";

/**
 * Reusable empty‑state UI used when a list has no items.
 *
 * Props
 * -----
 * `title` – short bold headline.
 * `description` – secondary text explaining why the list is empty.
 * `ctaLabel` – text for the primary call‑to‑action button.
 * `ctaHref` – URL the button should navigate to.
 */
export default function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="text-center py-12 space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 mx-auto bg-[#F0FDF4] rounded-full">
        {/* Simple placeholder icon – you can replace with a custom SVG later */}
        <svg
          className="w-8 h-8 text-[#15803D]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[#191919]">{title}</h3>
      <p className="text-sm text-[#666666] max-w-sm mx-auto">{description}</p>
      <Link
        href={ctaHref}
        className="inline-block px-4 py-2 bg-[#191919] hover:bg-[#333333] text-white text-sm rounded-md transition-colors"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
