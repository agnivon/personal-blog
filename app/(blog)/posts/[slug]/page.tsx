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
import ExpandableSources, { type SourceItem } from "@/components/expandable-sources";

import { generatePostMetadata } from "@/config/metadata.config";
import { sanityFetch } from "@/sanity/lib/fetch";
import { postQuery } from "@/sanity/lib/queries";

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
  const post = await sanityFetch({ query: postQuery, params });

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
          {Boolean(post.content?.length) && (
            <PortableText
              className="prose prose-zinc dark:prose-invert prose-lg max-w-none leading-relaxed prose-headings:font-serif prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline"
              value={post.content as PortableTextBlock[]}
            />
          )}

          {/* Sources Section */}
          {post.sources && post.sources.length > 0 && (
            <ExpandableSources sources={post.sources as SourceItem[]} />
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
