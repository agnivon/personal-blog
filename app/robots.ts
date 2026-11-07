import type { MetadataRoute } from "next";
import { getCanonicalUrl, PRODUCTION_DOMAIN } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const sitemapUrl = getCanonicalUrl("/sitemap.xml");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/studio/"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
        ],
        allow: "/",
        disallow: ["/api/", "/studio/"],
      },
    ],
    sitemap: sitemapUrl,
    host: PRODUCTION_DOMAIN,
  };
}
