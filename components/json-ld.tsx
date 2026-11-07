import React from "react";
import { AUTHOR_NAME, AUTHOR_SITE_URL, getCanonicalUrl } from "@/lib/site";
import { urlForImage } from "@/sanity/lib/utils";

/**
 * Renders JSON-LD structured data into the document head/body for search engines
 * and AI-powered answer engines (AEO).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/**
 * Builds Schema.org WebSite, Blog, and Person schema graph for the homepage.
 */
export function generateWebsiteJsonLd(title?: string, description?: string) {
  const siteUrl = getCanonicalUrl("/");
  const siteName = title || AUTHOR_NAME;
  const siteDescription =
    description || "Curated articles, news grounding, and AI insights.";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: siteName,
        description: siteDescription,
        inLanguage: "en-US",
        publisher: {
          "@id": `${AUTHOR_SITE_URL}#author`,
        },
      },
      {
        "@type": "Person",
        "@id": `${AUTHOR_SITE_URL}#author`,
        name: AUTHOR_NAME,
        url: AUTHOR_SITE_URL,
        jobTitle: "Software Engineer",
        sameAs: [
          "https://github.com/agnivon",
        ],
      },
      {
        "@type": "Blog",
        "@id": `${siteUrl}#blog`,
        url: siteUrl,
        name: `${siteName} Blog`,
        description: siteDescription,
        inLanguage: "en-US",
        isPartOf: {
          "@id": `${siteUrl}#website`,
        },
        publisher: {
          "@id": `${AUTHOR_SITE_URL}#author`,
        },
      },
    ],
  };
}

interface PostJsonLdProps {
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  date?: string | null;
  _updatedAt?: string | null;
  coverImage?: unknown;
  author?: {
    name?: string | null;
    url?: string | null;
  } | null;
}

/**
 * Builds Schema.org BlogPosting and BreadcrumbList schema graph for individual articles.
 */
export function generateArticleJsonLd(post: PostJsonLdProps) {
  const siteUrl = getCanonicalUrl("/");
  const postUrl = post.slug ? getCanonicalUrl(`/posts/${post.slug}`) : siteUrl;
  const authorName = post.author?.name || AUTHOR_NAME;
  const authorUrl = post.author?.url || AUTHOR_SITE_URL;
  const imageUrl = post.coverImage
    ? urlForImage(post.coverImage)?.width(1200).height(630).fit("crop").url()
    : `${siteUrl}/opengraph-image`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${postUrl}#article`,
        isPartOf: {
          "@id": `${siteUrl}#blog`,
        },
        mainEntityOfPage: postUrl,
        headline: post.title,
        description: post.excerpt || post.title,
        ...(imageUrl ? { image: [imageUrl] } : {}),
        datePublished: post.date || new Date().toISOString(),
        dateModified: post._updatedAt || post.date || new Date().toISOString(),
        url: postUrl,
        inLanguage: "en-US",
        author: {
          "@type": "Person",
          "@id": `${AUTHOR_SITE_URL}#author`,
          name: authorName,
          url: authorUrl,
        },
        publisher: {
          "@type": "Person",
          "@id": `${AUTHOR_SITE_URL}#author`,
          name: AUTHOR_NAME,
          url: AUTHOR_SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${postUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Articles",
            item: `${siteUrl}/posts`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: postUrl,
          },
        ],
      },
    ],
  };
}

/**
 * Builds Schema.org CollectionPage and BreadcrumbList schema graph for archives page.
 */
export function generateArchivesJsonLd() {
  const siteUrl = getCanonicalUrl("/");
  const archivesUrl = getCanonicalUrl("/posts");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${archivesUrl}#collection`,
        url: archivesUrl,
        name: `All Stories & Archives | ${AUTHOR_NAME}`,
        description:
          "A curated collection of articles, news grounding, and AI insights.",
        isPartOf: {
          "@id": `${siteUrl}#website`,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${archivesUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Articles",
            item: archivesUrl,
          },
        ],
      },
    ],
  };
}
