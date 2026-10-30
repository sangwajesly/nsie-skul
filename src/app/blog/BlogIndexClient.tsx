"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, BookOpen, ArrowUpRight, MessageCircle } from "lucide-react";
import { BLOG_POSTS, BLOG_CATEGORIES } from "@/data/blog-posts";
import { BlogCard } from "@/components/blog/BlogCard";

export function BlogIndexClient() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchesCategory =
        activeCategory === "all" || post.categorySlug === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* ── Giant Bold Editorial Title (Inspiration from Reference Image) ── */}
      <div className="text-center pt-4 sm:pt-10">
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-black tracking-tighter text-[#142010] leading-none select-none">
          Articles
        </h1>

        {/* Minimalist Sub-Bar with Timeline & Category Counter */}
        <div className="mt-8 sm:mt-12 pt-3 border-t border-[#E8DFC9] flex items-center justify-between text-xs text-[#788470] font-mono">
          <span>Cameroon Secondary Education</span>
          <span className="hidden sm:inline text-[#B5AC98]">● ● ●</span>
          <span>2026 / 2027 Academic Year</span>
        </div>
      </div>

      {/* ── Category Filters & Search Bar ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeCategory === cat.slug
                  ? "bg-[#142010] text-white shadow-xs"
                  : "bg-white hover:bg-[#FAF6EC] text-[#525E4B] border border-[#E8DFC9]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#788470] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, CBA, rules..."
            className="w-full pl-9 pr-3 py-1.5 rounded-full bg-white border border-[#E8DFC9] text-xs text-[#142010] placeholder-[#888888] focus:outline-none focus:border-[#142010] shadow-2xs"
          />
        </div>
      </div>

      {/* ── Articles 3-Column Grid (Direct Inspiration from Reference) ── */}
      <section aria-label="Articles Grid">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[12px] border border-[#E8DFC9] p-8 space-y-3">
            <BookOpen className="w-10 h-10 text-[#788470] mx-auto" />
            <h3 className="text-base font-bold text-[#142010]">No articles found</h3>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              We couldn&apos;t find any articles matching &ldquo;{searchQuery}&rdquo;. Try another search term or select &ldquo;All Guides&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory("all");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-[#2A7C13] underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {filteredPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* ── High-Contrast Editorial Banner (Inspired by Bottom Section of Reference) ── */}
      <section className="pt-12 pb-6 border-t border-[#E8DFC9]">
        <div className="rounded-[16px] bg-[#FAF8F2] border border-[#E8DFC9] p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-md">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142010] tracking-tight leading-tight">
              Ready to modernize your school management?
            </h2>
            <p className="text-xs sm:text-[13px] text-[#555555] leading-relaxed">
              Automate official MINESEC report cards, continuous assessments, teacher duty allocations, and offline local LAN sync.
            </p>
            <div>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#142010] hover:bg-[#2A7C13] text-white font-bold text-xs shadow-sm transition-colors"
              >
                <span>Start Free 30-Day Pilot</span>
                <span className="text-sm">&rarr;</span>
              </Link>
            </div>
          </div>

          <div className="text-left md:text-right space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470] block">
              Curriculum &amp; Platform Support
            </span>
            <a
              href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20I%20have%20an%20inquiry%20regarding%20school%20onboarding."
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-2xl sm:text-3xl md:text-4xl font-black text-[#142010] hover:text-[#2A7C13] transition-colors tracking-tight font-mono"
            >
              <span>+237 682 833 601</span>
              <ArrowUpRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
            <p className="text-xs text-[#788470]">
              WhatsApp Hotline &middot; Available across all 10 Regions of Cameroon
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
