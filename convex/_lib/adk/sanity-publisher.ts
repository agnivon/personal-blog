import { htmlToBlocks } from "@portabletext/block-tools";
import { createClient } from "@sanity/client";
import { Schema } from "@sanity/schema";
import { JSDOM } from "jsdom";
import { ArraySchemaType } from "sanity";
import { marked } from "marked";
import { BlogGenerationResult, ResearchSource } from "./types";

export function getSanityClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-02-28";
  const token = process.env.SANITY_API_DEVELOPER_TOKEN;

  if (!projectId || !dataset) {
    throw new Error(
      "[Sanity Publisher] Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET in environment."
    );
  }

  return createClient({
    projectId,
    dataset,
    token,
    apiVersion,
    useCdn: false,
  });
}


const postSchema = Schema.compile({
  name: "myBlog",
  types: [
    {
      type: "object",
      name: "blogPost",
      fields: [
        {
          name: "content",
          title: "Content",
          type: "array",
          of: [{ type: "block" }],
        },
      ],
    },
  ],
});

export function markdownToPortableText(markdown: string) {
  const blockContentType = postSchema
    .get("blogPost")
    .fields.find(
      (field: ArraySchemaType<unknown>) => field.name === "content"
    )?.type;

  if (!blockContentType) {
    throw new Error("Unable to resolve Sanity block content schema definition.");
  }

  const html = marked.parse(markdown) as string;
  const blocks = htmlToBlocks(html, blockContentType, {
    parseHtml: (h) => new JSDOM(h).window.document,
  });
  return blocks;
}

function getExtensionFromMimeType(mimeType: string): string {
  const cleanMime = (mimeType || "").split(";")[0].trim().toLowerCase();
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  return map[cleanMime] || "png";
}

export type CoverImageInput =
  | { data: string; mimeType: string }
  | { url: string };

export async function uploadCoverImageAsset(
  image: CoverImageInput,
  slug: string
): Promise<string | undefined> {
  const client = getSanityClient();
  try {
    if ("data" in image && image.data && image.mimeType) {
      const ext = getExtensionFromMimeType(image.mimeType);
      const asset = await client.assets.upload(
        "image",
        Buffer.from(image.data, "base64"),
        {
          filename: `${slug}.${ext}`,
          contentType: image.mimeType.split(";")[0].trim(),
        }
      );
      return asset._id;
    }
    if ("url" in image && image.url) {
      const res = await fetch(image.url);
      if (!res.ok) {
        throw new Error(
          `Failed to fetch cover image from URL (${res.status} ${res.statusText}): ${image.url}`
        );
      }
      const rawContentType = res.headers.get("content-type") || "image/jpeg";
      const contentType = rawContentType.split(";")[0].trim().toLowerCase();
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = getExtensionFromMimeType(contentType);
      const asset = await client.assets.upload("image", buffer, {
        filename: `${slug}.${ext}`,
        contentType,
      });
      return asset._id;
    }
  } catch (err) {
    console.error("[Sanity Publisher] Failed to upload cover image asset:", err);
    throw err;
  }
  return undefined;
}

/**
 * Strips markdown markup syntax from a string, returning clean plain text.
 */
export function stripMarkdown(markdown: string): string {
  if (!markdown) return "";
  return markdown
    .replace(/!\[([^\]]*)\]\([^\)]*\)/g, "") // images
    .replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1") // links: keep text
    .replace(/#{1,6}\s+/g, "") // headings
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
    .replace(/(\*|_)(.*?)\1/g, "$2") // italic
    .replace(/~~(.*?)~~/g, "$1") // strikethrough
    .replace(/`{1,3}[^`]*`{1,3}/g, (match) => match.replace(/`/g, "")) // inline code / code blocks
    .replace(/^\s*>+\s?/gm, "") // blockquotes
    .replace(/<[^>]+>/g, "") // html tags
    .replace(/^[*-+]\s+/gm, "") // unordered list bullets
    .replace(/^\d+\.\s+/gm, "") // ordered list numbers
    .replace(/\n+/g, " ") // newlines to spaces
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim();
}

/**
 * Extracts a concise plain-text excerpt from markdown content.
 * Finds the first non-empty prose paragraph (skipping headings, dividers)
 * and truncates cleanly at word boundaries.
 */
export function extractExcerptFromMarkdown(
  content: string,
  maxLength: number = 200
): string {
  if (!content) return "";
  const paragraphs = content.split(/\n\s*\n/);
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("---") ||
      trimmed.startsWith("***") ||
      trimmed.startsWith("___")
    ) {
      continue;
    }
    const plain = stripMarkdown(trimmed);
    if (plain.length > 0) {
      if (plain.length <= maxLength) {
        return plain;
      }
      const truncated = plain.slice(0, maxLength);
      const lastSpace = truncated.lastIndexOf(" ");
      return (
        (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "..."
      );
    }
  }
  return "";
}

/**
 * Normalizes text to a URL-safe kebab-case slug and strictly caps
 * at maxLength (96 characters, per Sanity post schema).
 */
export function cleanSlug(text: string, maxLength: number = 96): string {
  const base = (text || "untitled-post")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const safeBase = base || "untitled-post";
  if (safeBase.length <= maxLength) {
    return safeBase;
  }

  const truncated = safeBase.slice(0, maxLength);
  const lastHyphen = truncated.lastIndexOf("-");
  if (lastHyphen > maxLength * 0.5) {
    return truncated.slice(0, lastHyphen).replace(/-+$/, "");
  }
  return truncated.replace(/-+$/, "");
}

/**
 * Generates an alphanumeric identifier safe for Sanity array keys.
 */
export function generateSanityKey(seed?: string, index?: number): string {
  if (seed) {
    const cleaned = seed.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 20);
    if (cleaned.length >= 3) {
      return `k_${cleaned}_${index ?? 0}`;
    }
  }
  return `key_${index ?? 0}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Extracts, validates, and deduplicates research sources from markdown texts
 * (dossiers, citations, or references sections).
 */
export function extractSourcesFromMarkdown(markdown: string): ResearchSource[] {
  if (!markdown) return [];

  const sources: ResearchSource[] = [];
  const seenUris = new Set<string>();

  function addSource(title: string, rawUri: string) {
    try {
      const parsedUrl = new URL(rawUri.trim());
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return;
      }
      parsedUrl.hash = "";
      const normalizedUri = parsedUrl.toString().replace(/\/$/, "");
      if (seenUris.has(normalizedUri)) {
        return;
      }
      seenUris.add(normalizedUri);

      let cleanTitle = title.trim().replace(/^[-*•0-9.)\s]+/, "");
      if (
        !cleanTitle ||
        cleanTitle.toLowerCase() === "source" ||
        cleanTitle.toLowerCase() === "link" ||
        cleanTitle === rawUri
      ) {
        cleanTitle = parsedUrl.hostname.replace(/^www\./, "");
      }

      sources.push({
        title: cleanTitle,
        uri: normalizedUri,
      });
    } catch {
      // Invalid URL syntax, ignore
    }
  }

  // 1. Match Markdown links: [Title](https://...)
  const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = mdLinkRegex.exec(markdown)) !== null) {
    addSource(match[1], match[2]);
  }

  // 2. Match bullet lists with Title: URL or Title - URL
  const listRegex = /(?:^|\n)\s*[-*•0-9.]+\s*([^:\n]+?)(?:\s*[:\-–—]\s*)(https?:\/\/[^\s\)]+)/g;
  while ((match = listRegex.exec(markdown)) !== null) {
    addSource(match[1], match[2]);
  }

  // 3. Match bare URLs in list items
  const bareUrlRegex = /(?:^|\n)\s*[-*•0-9.]+\s*(https?:\/\/[^\s\)]+)/g;
  while ((match = bareUrlRegex.exec(markdown)) !== null) {
    addSource("", match[1]);
  }

  return sources.slice(0, 15);
}

/**
 * Publishes a generated blog result directly to Sanity CMS.
 */
export async function publishResultToSanity(
  result: BlogGenerationResult,
  authorId?: string
): Promise<{ postId: string; slug: string }> {
  const slug = cleanSlug(result.metadata.slug || result.metadata.title);

  let imageAssetId: string | undefined;
  if (result.coverImage) {
    imageAssetId = await uploadCoverImageAsset(result.coverImage, slug);
  }

  const resolvedAuthorId =
    authorId || process.env.SANITY_BLOG_AUTHOR_ID;

  const doc: Record<string, unknown> = {
    _type: "post",
    title: result.metadata.title,
    slug: { _type: "slug", current: encodeURIComponent(slug) },
    excerpt: result.metadata.excerpt,
    content: markdownToPortableText(result.fullMarkdown),
    date: new Date().toISOString(),
    hide: false,
    sources: (result.sources || []).map((s, idx) => ({
      _key: generateSanityKey(s.uri, idx),
      name: s.title,
      uri: s.uri,
    })),
  };

  if (resolvedAuthorId) {
    doc.author = {
      _type: "reference",
      _ref: resolvedAuthorId,
    };
  }

  if (imageAssetId) {
    doc.coverImage = {
      _type: "image",
      asset: { _type: "reference", _ref: imageAssetId },
      alt: result.metadata.title || slug,
    };
  }

  const client = getSanityClient();
  const createdDoc = await client.create(doc as any);
  console.info(`[Sanity Publisher] Successfully created post document with ID: ${createdDoc._id}`);

  return {
    postId: createdDoc._id,
    slug,
  };
}
