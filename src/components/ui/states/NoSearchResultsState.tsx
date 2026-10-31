"use client";

import React from "react";
import { SearchX, RotateCcw, X, Filter } from "lucide-react";

export interface NoSearchResultsProps {
  query?: string;
  activeFilters?: { label: string; value: string; onRemove?: () => void }[];
  onClearSearch?: () => void;
  onResetAll?: () => void;
  suggestions?: string[];
  className?: string;
}

/**
 * 6. NO SEARCH RESULTS STATE
 * Dedicated empty state when an active search query or filter returns 0 records.
 */
export function NoSearchResultsState({
  query,
  activeFilters,
  onClearSearch,
  onResetAll,
  suggestions,
  className = "",
}: NoSearchResultsProps) {
  const defaultSuggestions = [
    "Check for typos or character spelling differences (e.g. Jean vs John).",
    "Search using the student's official matricule or last name only.",
    "Remove or broaden class stream and sequence filters.",
  ];

  const effectiveSuggestions = suggestions && suggestions.length > 0 ? suggestions : defaultSuggestions;

  return (
    <div
      className={`p-6 sm:p-8 rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs text-center max-w-lg mx-auto space-y-4 ${className}`}
      role="status"
    >
      {/* Icon Badge */}
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#F7F3E8] border border-[#E8DFC9] text-[#7A5B00] mx-auto">
        <SearchX className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-[#142010] tracking-tight">
          {query ? (
            <>
              No results found for <span className="text-[#2A7C13]">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            "No matching records found"
          )}
        </h3>
        <p className="text-xs text-[#525E4B]">
          No records matched your search query or the selected filter criteria.
        </p>
      </div>

      {/* Active Filter Chips if any */}
      {activeFilters && activeFilters.length > 0 && (
        <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#888888] flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>
          {activeFilters.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8DFC9] text-xs font-semibold text-[#142010]"
            >
              <span>{f.label}: <strong>{f.value}</strong></span>
              {f.onRemove && (
                <button
                  type="button"
                  onClick={f.onRemove}
                  className="p-0.5 hover:bg-[#E8DFC9] rounded-full text-[#888888] hover:text-[#142010] cursor-pointer"
                  title={`Remove ${f.label} filter`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Helpful suggestions */}
      <div className="p-3 rounded-[6px] bg-[#FAF8F5] border border-[#E8DFC9] text-left text-[11px] text-[#525E4B] space-y-1">
        <span className="font-bold text-[#142010] block mb-1">Search Suggestions:</span>
        <ul className="list-disc list-inside space-y-0.5 text-[#555555]">
          {effectiveSuggestions.map((s, idx) => (
            <li key={idx}>{s}</li>
          ))}
        </ul>
      </div>

      {/* Clear Action Button */}
      {(onClearSearch || onResetAll) && (
        <div className="pt-1 flex items-center justify-center gap-2">
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Search Term</span>
            </button>
          )}

          {onResetAll && (
            <button
              type="button"
              onClick={onResetAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[5px] bg-white border border-[#D5CBB2] text-[#444444] hover:bg-[#F7F3E8] text-xs font-semibold transition-colors cursor-pointer"
            >
              <X className="w-3 h-3 text-[#888888]" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default NoSearchResultsState;
