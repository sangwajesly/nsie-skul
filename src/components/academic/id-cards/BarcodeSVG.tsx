"use client";

import React, { useMemo } from "react";

interface BarcodeSVGProps {
  value: string;
  width?: number;
  height?: number;
  className?: string;
  showText?: boolean;
}

export function BarcodeSVG({
  value,
  width = 140,
  height = 28,
  className = "",
  showText = true,
}: BarcodeSVGProps) {
  // Generate deterministic bar widths based on input string
  const bars = useMemo(() => {
    const clean = (value || "STU-001").toUpperCase();
    const pattern: number[] = [2, 1, 1, 2]; // Start guard

    for (let i = 0; i < clean.length; i++) {
      const charCode = clean.charCodeAt(i);
      pattern.push((charCode % 3) + 1);
      pattern.push(((charCode >> 1) % 2) + 1);
      pattern.push(((charCode >> 2) % 3) + 1);
      pattern.push(1);
    }
    pattern.push(2, 1, 2); // Stop guard

    const totalUnits = pattern.reduce((acc, u) => acc + u, 0);
    const rects: { x: number; w: number; isDark: boolean }[] = [];
    let currentX = 0;

    pattern.forEach((unit, idx) => {
      const isDark = idx % 2 === 0;
      if (isDark) {
        rects.push({ x: currentX, w: unit, isDark: true });
      }
      currentX += unit;
    });

    return { rects, totalUnits };
  }, [value]);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${bars.totalUnits} ${height}`}
        style={{ width: `${width}px`, height: `${height}px`, shapeRendering: "crispEdges" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {bars.rects.map((r, i) => (
          <rect
            key={i}
            x={r.x}
            y={0}
            width={r.w}
            height={height}
            fill="#000000"
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[8px] font-bold tracking-widest text-black mt-0.5">
          {value}
        </span>
      )}
    </div>
  );
}
