import Image from "next/image";
import { BRAND } from "@/lib/design-tokens";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<LogoSize, { px: number; boxClass: string; radiusClass: string }> = {
  xs: { px: 24, boxClass: "w-6 h-6", radiusClass: "rounded-[6px]" },
  sm: { px: 32, boxClass: "w-8 h-8", radiusClass: "rounded-[7px]" },
  md: { px: 36, boxClass: "w-9 h-9", radiusClass: "rounded-[8px]" },
  lg: { px: 48, boxClass: "w-12 h-12", radiusClass: "rounded-[10px]" },
  xl: { px: 56, boxClass: "w-14 h-14", radiusClass: "rounded-[12px]" },
};

interface NseiLogoMarkProps {
  size?: LogoSize;
  priority?: boolean;
  className?: string;
}

/**
 * Renders the official Nsei Sukul crest mark (/app-icon.png).
 */
export function NseiLogoMark({
  size = "sm",
  priority = false,
  className = "",
}: NseiLogoMarkProps) {
  const cfg = SIZE_MAP[size];

  return (
    <div
      className={`${cfg.boxClass} ${cfg.radiusClass} bg-[#142010] flex items-center justify-center shrink-0 overflow-hidden shadow-xs ring-1 ring-[#4ADE80]/20 ${className}`}
    >
      <Image
        src="/app-icon.png"
        alt="Nsei Sukul Logo"
        width={cfg.px}
        height={cfg.px}
        priority={priority}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

interface NseiBrandLogoProps {
  size?: LogoSize;
  tone?: "dark" | "light";
  subtitle?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Renders the complete horizontal Nsei Sukul brand lockup (crest + wordmark + subtitle).
 */
export function NseiBrandLogo({
  size = "sm",
  tone = "dark",
  subtitle = BRAND.systemTitle,
  priority = false,
  className = "",
}: NseiBrandLogoProps) {
  const isLightText = tone === "light";

  return (
    <div className={`inline-flex items-center gap-2.5 shrink-0 ${className}`}>
      <NseiLogoMark size={size} priority={priority} />
      <div className="flex flex-col">
        <span
          className={`font-extrabold text-[16px] tracking-tight leading-none ${
            isLightText ? "text-white" : "text-[#142010]"
          }`}
        >
          {BRAND.name}
        </span>
        {subtitle && (
          <span
            className={`text-[10px] font-semibold tracking-wide uppercase mt-0.5 ${
              isLightText ? "text-[#7FA776]" : "text-[#788470]"
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
