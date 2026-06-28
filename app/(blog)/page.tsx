import Link from "next/link";
import { Suspense } from "react";

import Avatar from "../../components/avatar";
import CoverImage from "../../components/cover-image";
import DateComponent from "../../components/date";
import MoreStories from "../../components/more-stories";
import Onboarding from "../../components/onboarding";
import PortableText from "../../components/portable-text";

import type { HeroQueryResult } from "@/sanity.types";
import * as demo from "@/sanity/lib/demo";
import { sanityFetch } from "@/sanity/lib/fetch";
import { heroQuery, settingsQuery } from "@/sanity/lib/queries";

function Intro(props: { title: string | null | undefined; description: any }) {
  const title = props.title || demo.title;
  const description = props.description?.length
    ? props.description
    : demo.description;
  return (
    <section className="mt-8 mb-16 md:mb-24 grid grid-cols-1 gap-6 md:grid-cols-12 items-start">
      <div className="md:col-span-6">
        <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-gradient leading-[1.1]">
          {title || demo.title}
        </h1>
      </div>
      <div className="md:col-span-6 md:pl-6 text-muted-foreground text-base md:text-lg leading-relaxed font-light">
        <PortableText
          className="prose-base dark:prose-invert max-w-lg"
          value={description?.length ? description : demo.description}
        />
      </div>
    </section>
  );
}

function HeroPost({
  title,
  slug,
  excerpt,
  coverImage,
  date,
  author,
}: Pick<
  Exclude<HeroQueryResult, null>,
  "title" | "coverImage" | "date" | "excerpt" | "author" | "slug"
>) {
  return (
    <article className="group relative grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12 items-center mb-16 md:mb-24">
      {/* Left side: Image container with hover scaling */}
      <div className="md:col-span-7 overflow-hidden rounded-2xl border border-border/40 bg-muted">
        <Link href={`/posts/${slug}`} className="block overflow-hidden aspect-[16/10]">
          <div className="w-full h-full scale-100 group-hover:scale-[1.03] transition-transform duration-700 ease-out">
            <CoverImage image={coverImage} priority />
          </div>
        </Link>
      </div>

      {/* Right side: Content with visual hierarchy */}
      <div className="md:col-span-5 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-4 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          <span>Featured Post</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
          <DateComponent dateString={date} />
        </div>

        <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <Link href={`/posts/${slug}`}>
            {title}
          </Link>
        </h3>

        {excerpt && (
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-6 font-light">
            {excerpt}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-border/40 pt-5">
          {author && <Avatar name={author.name} picture={author.picture} />}
          <Link 
            href={`/posts/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Read Article
            <span className="inline-block transform transition-transform group-hover:translate-x-1 duration-200">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function Page() {
  const [settings, heroPost] = await Promise.all([
    sanityFetch({
      query: settingsQuery,
    }),
    sanityFetch({ query: heroQuery }),
  ]);

  return (
    <div className="container mx-auto px-5 max-w-6xl">
      <Intro title={settings?.title} description={settings?.description} />
      {heroPost ? (
        <HeroPost
          title={heroPost.title}
          slug={heroPost.slug}
          coverImage={heroPost.coverImage}
          excerpt={heroPost.excerpt}
          date={heroPost.date}
          author={heroPost.author}
        />
      ) : (
        <Onboarding />
      )}
      {heroPost?._id && (
        <aside className="mt-16 md:mt-24 pt-16 border-t border-border/40">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Archives</span>
              <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight mt-1">
                More Stories
              </h2>
            </div>
            <Link 
              href="/posts" 
              className="text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 mt-4 md:mt-0 inline-flex items-center gap-1 group/arch"
            >
              View all archive
              <span className="transform transition-transform group-hover/arch:translate-x-1">→</span>
            </Link>
          </div>
          <Suspense>
            <MoreStories skip={heroPost._id} limit={10} />
          </Suspense>

          {/* Newsletter Box */}
          {/*
          <div className="mt-24 p-8 md:p-12 rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Newsletter</span>
              <h3 className="font-serif text-3xl font-bold tracking-tight mt-2 mb-3">
                Subscribe to stay updated
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-light">
                Join our newsletter to receive daily AI-generated insights, cover art releases, and web development deep-dives right in your inbox.
              </p>
              <form className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  required
                  className="flex-grow px-4 py-3 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button 
                  type="submit" 
                  className="px-6 py-3 text-sm font-semibold text-background bg-foreground hover:bg-foreground/90 rounded-xl transition-all duration-150 cursor-pointer shadow-md active:scale-95"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          */}
        </aside>
      )}
    </div>
  );
}
