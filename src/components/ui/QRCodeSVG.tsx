"use client";

import React, { useMemo } from "react";
import { encodeQRMatrix } from "@/lib/qrcode/pure-qr";

interface QRCodeSVGProps {
  value: string;
  size?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
  quietZone?: number;
}

export function QRCodeSVG({
  value,
  size = 64,
  className = "",
  fgColor = "#000000",
  bgColor = "#FFFFFF",
  quietZone = 2,
}: QRCodeSVGProps) {
  const { matrix, viewBoxSize } = useMemo(() => {
    try {
      const m = encodeQRMatrix(value || "https://sukul.cm");
      const s = m.length;
      return {
        matrix: m,
        viewBoxSize: s + quietZone * 2,
      };
    } catch {
      // Fallback empty 21x21 matrix if encoding fails
      const empty = Array.from({ length: 21 }, () => Array(21).fill(false));
      return { matrix: empty, viewBoxSize: 21 + quietZone * 2 };
    }
  }, [value, quietZone]);

  const cells = useMemo(() => {
    const list: React.ReactElement[] = [];
    matrix.forEach((row, r) => {
      row.forEach((isDark, c) => {
        if (isDark) {
          list.push(
            <rect
              key={`${r}-${c}`}
              x={c + quietZone}
              y={r + quietZone}
              width={1}
              height={1}
              fill={fgColor}
            />
          );
        }
      });
    });
    return list;
  }, [matrix, quietZone, fgColor]);

  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width={size}
      height={size}
      className={`shape-rendering-crisp-edges select-none ${className}`}
      style={{ shapeRendering: "crispEdges" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill={bgColor} />
      {cells}
    </svg>
  );
}
