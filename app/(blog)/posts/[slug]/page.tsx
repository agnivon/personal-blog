import type { Metadata, ResolvingMetadata } from "next";
import { defineQuery, type PortableTextBlock } from "next-sanity";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Avatar from "@/components/avatar";
import CoverImage from "@/components/cover-image";
import DateComponent from "@/components/date";
import MoreStories from "@/components/more-stories";
import PortableText from "@/components/portable-text";
import ScrollProgressBar from "@/components/scroll-progress-bar";

import { generatePostMetadata } from "@/config/metadata.config";
import * as demo from "@/sanity/lib/demo";
import { sanityFetch } from "@/sanity/lib/fetch";
import { postQuery, settingsQuery } from "@/sanity/lib/queries";

type Props = {
  params: Promise<{ slug: string }>;
};

const postSlugs = defineQuery(
  `*[_type == "post" && defined(slug.current) && hide != true]{"slug": slug.current}`
);

export async function generateStaticParams() {
  return await sanityFetch({
    query: postSlugs,
    perspective: "published",
    stega: false,
  });
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return generatePostMetadata({ slug: (await params).slug }, parent);
}

export default async function PostPage({ params }: Props) {
  const [post, settings] = await Promise.all([
    sanityFetch({ query: postQuery, params }),
    sanityFetch({ query: settingsQuery }),
  ]);

  if (!post?._id) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-5 max-w-4xl">
      <ScrollProgressBar />
      
      {/* Back Navigation */}
      <div className="mb-10 mt-6 flex items-center">
        <Link 
          href="/" 
          className="group inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="inline-block transform transition-transform group-hover:-translate-x-1 duration-200 mr-1.5">←</span>
          Back to articles
        </Link>
      </div>

      <article className="mb-20">
        {/* Post Header */}
        <header className="mb-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-4 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <span>Article</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <DateComponent dateString={post.date} />
          </div>
          
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 tracking-tight text-pretty">
            {post.title}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-y border-border/40 py-5 gap-4">
            {post.author && (
              <div className="flex justify-center sm:justify-start">
                <Avatar name={post.author.name} picture={post.author.picture} />
              </div>
            )}
            <div className="text-center sm:text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Published on <DateComponent dateString={post.date} />
            </div>
          </div>
        </header>

        {/* Cover Image */}
        <div className="mb-12 overflow-hidden rounded-2xl border border-border/40 bg-muted aspect-[16/9] shadow-sm">
          <CoverImage image={post.coverImage} priority />
        </div>

        {/* Content Body */}
        <div className="mx-auto max-w-2xl">
          {post.content?.length && (
            <PortableText
              className="prose prose-zinc dark:prose-invert prose-lg max-w-none leading-relaxed prose-headings:font-serif prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline"
              value={post.content as PortableTextBlock[]}
            />
          )}

          {/* Sources Section */}
          {post.sources && post.sources.length > 0 && (
            <div className="mt-16 border-t border-border/40 pt-10">
              <h3 className="font-serif text-2xl font-bold mb-6">Sources & Grounding</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {post.sources.map((src: any) => (
                  <a 
                    key={src._key} 
                    href={src.uri} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/50 hover:bg-card hover:border-foreground/20 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-sm font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{src.name}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[260px]">{src.uri}</span>
                    </div>
                    <span className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all text-sm shrink-0">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Footer / More Stories */}
      <aside className="border-t border-border/40 pt-16 mt-20">
        <h2 className="font-serif text-3xl font-bold tracking-tight mb-10 text-center md:text-left">
          Recent Stories
        </h2>
        <Suspense>
          <MoreStories skip={post._id} limit={2} />
        </Suspense>
      </aside>
    </div>
  );
}
