import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { 
  Clock, 
  Calendar, 
  ChevronRight, 
  ArrowUpRight
} from "lucide-react";
import { BLOG_POSTS } from "@/data/blog-posts";
import { MarketingHeader } from "@/components/landing/MarketingHeader";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { WhatsAppShareButton } from "@/components/blog/WhatsAppShareButton";
import { CompetencyCopyWidget } from "@/components/blog/CompetencyCopyWidget";
import { InlineProductCallout } from "@/components/blog/InlineProductCallout";
import { BlogVisualCover } from "@/components/blog/BlogVisualCover";
import { BlogCard } from "@/components/blog/BlogCard";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: "Article Not Found | Nsei Sukul",
    };
  }

  return {
    title: `${post.title} | Nsei Sukul`,
    description: post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishDate,
      authors: [post.author.name],
      tags: post.tags,
      locale: "en_CM",
      siteName: "Nsei Sukul Management System",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] text-[#142010] antialiased">
      <MarketingHeader currentPath="/blog" />

      <main className="flex-1 pb-16 sm:pb-24">
        {/* ── Editorial Header (Inspired by Image 2 detail view) ── */}
        <header className="pt-10 sm:pt-16 pb-6">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 space-y-4 text-center">
            {/* Breadcrumbs */}
            <nav className="flex items-center justify-center gap-2 text-xs text-[#788470]" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-[#142010] transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3 h-3 text-[#B5AC98]" />
              <Link href="/blog" className="hover:text-[#142010] transition-colors">
                Articles
              </Link>
              <ChevronRight className="w-3 h-3 text-[#B5AC98]" />
              <span className="text-[#142010] font-semibold">
                {post.category}
              </span>
            </nav>

            {/* Giant Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#142010] tracking-tight leading-[1.12] pt-2">
              {post.title}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-[#555555] leading-relaxed max-w-2xl mx-auto">
              {post.subtitle}
            </p>

            {/* Metadata Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-[#788470] font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#555555]" />
                <span>{post.publishDate}</span>
              </span>
              <span className="text-[#C8BFAB]">|</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#2A7C13]" />
                <span>{post.readTime}</span>
              </span>
              <span className="text-[#C8BFAB]">|</span>
              <span>By {post.author.name}</span>
            </div>
          </div>
        </header>

        {/* ── Wide Hero Mockup Visual (Inspiration from Image 2 top laptop visual) ── */}
        <div className="max-w-4xl mx-auto px-5 sm:px-8 my-6 sm:my-10">
          <div className="rounded-[16px] overflow-hidden border border-[#E8DFC9] shadow-lg">
            <BlogVisualCover type={post.visualType} isHero={true} />
          </div>
        </div>

        {/* ── Main Reading Content ── */}
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <article className="space-y-6 text-[#222222]">
            {/* Render Styled Article HTML */}
            <div
              className="prose prose-sm sm:prose-base max-w-none prose-headings:text-[#142010] prose-a:text-[#2A7C13] prose-strong:text-[#142010] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />

            {/* Interactive Widget for CBA Appreciations */}
            {post.slug === "minesec-cba-competency-appreciations" && (
              <div className="pt-4">
                <CompetencyCopyWidget />
              </div>
            )}

            {/* Inline Product Bridge */}
            <InlineProductCallout />

            {/* WhatsApp Viral Sharing Banner */}
            <div className="pt-6">
              <WhatsAppShareButton
                title={post.title}
                shareText={post.whatsappShareText}
                variant="banner"
              />
            </div>

            {/* Tags */}
            <div className="pt-6 border-t border-[#E8DFC9] flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#555555]">Tags:</span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-[#FAF6EC] border border-[#E8DFC9] text-xs text-[#525E4B] font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </article>
        </div>

        {/* ── Related Articles Grid (3-column layout matching reference) ── */}
        {relatedPosts.length > 0 && (
          <section className="mt-20 pt-16 border-t border-[#E8DFC9]">
            <div className="max-w-6xl mx-auto px-5 sm:px-8 space-y-10">
              <div className="flex items-end justify-between border-b border-[#E8DFC9] pb-4">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#142010] tracking-tight">
                    More Articles
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#666666] mt-1">
                    Explore further guides and official MINESEC toolkits.
                  </p>
                </div>
                <Link
                  href="/blog"
                  className="text-xs font-bold text-[#2A7C13] hover:underline"
                >
                  All Articles &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map((p) => (
                  <BlogCard key={p.slug} post={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Bottom Project / School Idea Banner (Inspiration from bottom of Image 1) ── */}
        <section className="mt-20 max-w-6xl mx-auto px-5 sm:px-8">
          <div className="rounded-[16px] bg-[#FAF8F2] border border-[#E8DFC9] p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3 max-w-md">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142010] tracking-tight leading-tight">
                Have questions or need school setup?
              </h2>
              <p className="text-xs sm:text-[13px] text-[#555555] leading-relaxed">
                Connect directly with our local engineering team in Cameroon to deploy Nsei Sukul or the Offline School Hub.
              </p>
              <div>
                <a
                  href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20I%20would%20like%20to%20request%20a%20school%20demonstration."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#142010] hover:bg-[#2A7C13] text-white font-bold text-xs shadow-sm transition-colors"
                >
                  <span>Book a free strategy call</span>
                  <span className="text-sm">&rarr;</span>
                </a>
              </div>
            </div>

            <div className="text-left md:text-right space-y-2">
              <a
                href="https://wa.me/237682833601"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-2xl sm:text-3xl md:text-4xl font-black text-[#142010] hover:text-[#2A7C13] transition-colors tracking-tight font-mono"
              >
                <span>+237 682 833 601</span>
                <ArrowUpRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
              <p className="text-xs text-[#788470]">
                Republic of Cameroon &middot; Secondary Education Support
              </p>
            </div>
          </div>
        </section>

        {/* Floating Mobile WhatsApp Share Pill */}
        <WhatsAppShareButton
          title={post.title}
          shareText={post.whatsappShareText}
          variant="floating"
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
