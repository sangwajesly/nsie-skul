import Link from "next/link";
import { BlogVisualCover } from "./BlogVisualCover";
import type { BlogPost } from "@/data/blog-posts";

interface Props {
  post: BlogPost;
  featured?: boolean;
}

export function BlogCard({ post }: Props) {
  return (
    <article className="group flex flex-col justify-between p-4.5 rounded-[14px] bg-[#FFFDF5] border border-[#E8DFC9] hover:border-[#2A7C13] hover:-translate-y-1 hover:shadow-md transition-all duration-200">
      <div className="space-y-3.5">
        {/* Visual Cover Container */}
        <Link
          href={`/blog/${post.slug}`}
          className="block relative rounded-[10px] overflow-hidden border border-[#E8DFC9]/70 group-hover:border-[#2A7C13]/50 transition-colors"
        >
          <BlogVisualCover type={post.visualType} />
        </Link>

        {/* Metadata Line: Date | Read Time | Category */}
        <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#788470] font-medium tracking-wide flex-wrap">
          <span>{post.publishDate}</span>
          <span className="text-[#C8BFAB]">|</span>
          <span>{post.readTime}</span>
          <span className="text-[#C8BFAB]">|</span>
          <span className="inline-flex items-center gap-1 font-semibold text-[#2A7C13] uppercase tracking-wider text-[10px] bg-[#EAF7E4] px-2 py-0.5 rounded-full border border-[#76C457]/30">
            <span className="w-1 h-1 rounded-full bg-[#2A7C13]" />
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-[17px] font-bold text-[#142010] leading-snug group-hover:text-[#2A7C13] transition-colors">
          <Link href={`/blog/${post.slug}`} className="line-clamp-2">
            {post.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className="text-xs sm:text-[13px] text-[#525E4B] leading-relaxed line-clamp-2">
          {post.excerpt}
        </p>
      </div>

      <div className="pt-3 mt-4 border-t border-[#E8DFC9]/60">
        <Link
          href={`/blog/${post.slug}`}
          className="text-xs font-bold text-[#2A7C13] group-hover:underline inline-flex items-center gap-1"
        >
          <span>Read Pedagogic Guide</span>
          <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
        </Link>
      </div>
    </article>
  );
}
