import type { MetadataRoute } from "next";
import { sanityFetch } from "@/sanity/lib/fetch";
import { sitemapPostsQuery } from "@/sanity/lib/queries";
import { getCanonicalUrl } from "@/lib/site";
import type { SitemapPostsQueryResult } from "@/sanity.types";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts: SitemapPostsQueryResult = await sanityFetch({
    query: sitemapPostsQuery,
    perspective: "published",
    stega: false,
  });

  const postEntries: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: getCanonicalUrl(`/posts/${post.slug}`),
    lastModified: new Date(post._updatedAt || post.date || Date.now()),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    {
      url: getCanonicalUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: getCanonicalUrl("/posts"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...postEntries,
  ];
}
