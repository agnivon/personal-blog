"use node";

import { postByIdQuery } from "@/sanity/lib/queries";
import { webcrypto } from "crypto";
import {
  cleanSlug,
  CoverImageInput,
  extractExcerptFromMarkdown,
  extractSourcesFromMarkdown,
  generateSanityKey,
  getSanityClient,
  markdownToPortableText,
  stripMarkdown,
  uploadCoverImageAsset,
} from "./adk/sanity-publisher";

if (typeof globalThis.crypto === "undefined") {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}

/**
 * Converts markdown string into Sanity Portable Text blocks.
 * Delegates to centralized adk/sanity-publisher with full GFM extensions.
 */
export function createBlockContent(content: string) {
  return markdownToPortableText(content);
}

export type CreatePostArgs = {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: CoverImageInput;
  image?: CoverImageInput;
  slug?: string;
  date?: string;
  authorId?: string;
  sources?: { name: string; uri: string }[];
  hide?: boolean;
};

/**
 * Directly creates a blog post document in Sanity CMS.
 * Supports markdown content, markdown-stripped excerpt, flexible cover images
 * (base64 or URL), custom or auto-derived slug/sources/date, and hide state.
 */
export async function createPost(args: CreatePostArgs) {
  const {
    title,
    content,
    excerpt: rawExcerpt,
    coverImage,
    image,
    slug: rawSlug,
    date = new Date().toISOString(),
    authorId = process.env.SANITY_BLOG_AUTHOR_ID,
    sources,
    hide = false,
  } = args;

  const resolvedImage = coverImage || image;
  const slug = cleanSlug(rawSlug || title);
  console.log("[Sanity] Creating post with slug:", slug);

  let imageAssetId: string | undefined;
  if (resolvedImage) {
    imageAssetId = await uploadCoverImageAsset(resolvedImage, slug);
    console.log("[Sanity] Cover image asset ID:", imageAssetId);
  }

  // Resolve excerpt: strip markdown if provided; otherwise extract first prose paragraph
  const excerpt = rawExcerpt
    ? stripMarkdown(rawExcerpt)
    : extractExcerptFromMarkdown(content);

  // Resolve sources: use explicit sources if provided; otherwise extract from markdown content
  const resolvedSources =
    sources !== undefined
      ? sources
      : extractSourcesFromMarkdown(content).map((s) => ({
          name: s.title,
          uri: s.uri,
        }));

  const doc: Record<string, unknown> = {
    _type: "post",
    title,
    slug: { _type: "slug", current: encodeURIComponent(slug) },
    excerpt,
    content: markdownToPortableText(content),
    date,
    hide,
    sources: resolvedSources.map((s, idx) => ({
      _key: generateSanityKey(s.uri, idx),
      name: s.name,
      uri: s.uri,
    })),
  };

  if (authorId) {
    doc.author = {
      _type: "reference",
      _ref: authorId,
    };
  }

  if (imageAssetId) {
    doc.coverImage = {
      _type: "image",
      asset: { _type: "reference", _ref: imageAssetId },
      alt: title || slug,
    };
  }

  const client = getSanityClient();
  const createdDoc = await client.create(doc as any);
  console.info(`[Sanity] Successfully created post document with ID: ${createdDoc._id}`);

  return {
    _id: createdDoc._id,
    slug,
    title,
  };
}

export function getPost(id: string) {
  const client = getSanityClient();
  return client.fetch(postByIdQuery, { id });
}

export async function updatePostCoverImage(
  id: string,
  title: string,
  image: CoverImageInput
) {
  const slug = cleanSlug(title);
  console.log("Article slug:", slug);
  const imageAssetId = await uploadCoverImageAsset(image, slug);
  console.log("Cover image asset ID:", imageAssetId);
  const client = getSanityClient();
  return client
    .patch(id)
    .set({
      coverImage: {
        _type: "image",
        asset: { _type: "reference", _ref: imageAssetId },
        alt: title || slug,
      },
    })
    .commit();
}
