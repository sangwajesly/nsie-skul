import Link from "next/link";
import { BlogVisualCover } from "./BlogVisualCover";
import type { BlogPost } from "@/data/blog-posts";

interface Props {
  post: BlogPost;
  featured?: boolean;
}

export function BlogCard({ post }: Props) {
  return (
    <article className="group flex flex-col space-y-3.5">
      {/* Visual Cover Container (Inspired by reference mockup showcase) */}
      <Link
        href={`/blog/${post.slug}`}
        className="block relative rounded-[12px] overflow-hidden border border-[#E8DFC9] shadow-2xs hover:shadow-md transition-all duration-300"
      >
        <BlogVisualCover type={post.visualType} />
      </Link>

      {/* Metadata Line: Date | Read Time | Category */}
      <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#788470] font-medium tracking-wide">
        <span>{post.publishDate}</span>
        <span className="text-[#C8BFAB]">|</span>
        <span>{post.readTime}</span>
        <span className="text-[#C8BFAB]">|</span>
        <span className="font-semibold text-[#2A7C13] uppercase tracking-wider text-[10px]">
          {post.category}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base sm:text-[18px] font-bold text-[#142010] leading-snug group-hover:text-[#2A7C13] transition-colors">
        <Link href={`/blog/${post.slug}`} className="line-clamp-2">
          {post.title}
        </Link>
      </h3>

      {/* Excerpt */}
      <p className="text-xs sm:text-[13px] text-[#555555] leading-relaxed line-clamp-2">
        {post.excerpt}
      </p>
    </article>
  );
}
