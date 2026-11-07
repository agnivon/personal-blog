import { sanityFetch } from "@/sanity/lib/fetch";
import { feedQuery } from "@/sanity/lib/queries";
import { AUTHOR_NAME, AUTHOR_SITE_URL, getCanonicalUrl } from "@/lib/site";
import type { FeedQueryResult } from "@/sanity.types";

export const revalidate = 3600;

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return char;
    }
  });
}

export async function GET() {
  const posts: FeedQueryResult = await sanityFetch({
    query: feedQuery,
    perspective: "published",
    stega: false,
  });

  const siteUrl = getCanonicalUrl("/");
  const feedUrl = getCanonicalUrl("/feed.xml");

  const itemsXml = (posts || [])
    .map((post) => {
      const postUrl = getCanonicalUrl(`/posts/${post.slug}`);
      const pubDate = post.date
        ? new Date(post.date).toUTCString()
        : new Date().toUTCString();
      const title = escapeXml(post.title || "Untitled");
      const description = escapeXml(post.excerpt || "");
      const author = escapeXml(post.author || AUTHOR_NAME);

      return `    <item>
      <title>${title}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      <author>${author} (${AUTHOR_SITE_URL})</author>
    </item>`;
    })
    .join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(AUTHOR_NAME)} | Personal Blog &amp; AI Insights</title>
    <link>${siteUrl}</link>
    <description>Curated articles, news grounding, and AI insights by ${escapeXml(AUTHOR_NAME)} (${AUTHOR_SITE_URL}).</description>
    <managingEditor>${escapeXml(AUTHOR_NAME)} (${AUTHOR_SITE_URL})</managingEditor>
    <webMaster>${escapeXml(AUTHOR_NAME)} (${AUTHOR_SITE_URL})</webMaster>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;

  return new Response(rssXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
