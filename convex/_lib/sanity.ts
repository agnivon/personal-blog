"use node";

import { apiVersion, dataset, projectId } from "@/sanity/lib/api";
import { postByIdQuery } from "@/sanity/lib/queries";
import { Blob as GoogleGenAIBlob, GroundingChunk } from "@google/genai";
import { htmlToBlocks } from "@portabletext/block-tools";
import { createClient } from "@sanity/client";
import { Schema } from "@sanity/schema";
import { webcrypto } from "crypto";
import { JSDOM } from "jsdom";
import { ArraySchemaType } from "sanity";
import showdown from "showdown";

if (typeof globalThis.crypto === "undefined") {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}

const client = createClient({
  projectId: projectId, // your Sanity project ID
  dataset: dataset, // e.g. 'production'
  token: process.env.SANITY_API_DEVELOPER_TOKEN, // token with write permissions
  apiVersion: apiVersion,
  useCdn: false, // disable CDN for writes
});

const converter = new showdown.Converter();

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

export function createBlockContent(content: string) {
  const blockContentType = postSchema
    .get("blogPost")
    .fields.find(
      (field: ArraySchemaType<unknown>) => field.name === "content"
    )?.type;
  if (blockContentType) {
    const html = converter.makeHtml(content);
    // console.log(html);
    const blocks = htmlToBlocks(html, blockContentType, {
      parseHtml: (html) => new JSDOM(html).window.document,
    });
    return blocks;
  }
}

function getExtensionFromMimeType(mimeType: string): string | undefined {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  return map[mimeType];
}

async function uploadImage({
  image,
  filename,
}: {
  image: GoogleGenAIBlob;
  filename: string;
}) {
  if (image.data && image.mimeType) {
    const asset = await client.assets.upload(
      "image",
      Buffer.from(image.data, "base64"),
      {
        filename: `${filename}.${getExtensionFromMimeType(image.mimeType)}`,
        contentType: image.mimeType,
      }
    );

    return asset._id; // Use this in coverImage.asset._ref
  }
}

function getSlug(title: string): string {
  return title.toLowerCase().replaceAll(" ", "-");
}

export async function createPost({
  title,
  excerpt,
  content,
  sources = [],
  image,
}: {
  title: string;
  excerpt: string;
  content: string;
  sources?: GroundingChunk[];
  image: GoogleGenAIBlob;
}) {
  const slug = getSlug(title);
  console.log("Article slug:", slug);
  const imageAssetId = await uploadImage({ image, filename: slug });
  console.log("Cover image asset ID:", imageAssetId);
  const doc = {
    // _id: `post-${nanoid()}`,
    _type: "post",
    title: title,
    slug: { _type: "slug", current: encodeURIComponent(slug) },
    excerpt: excerpt,
    content: createBlockContent(content),
    date: new Date().toISOString(),
    author: {
      _type: "reference",
      _ref: process.env.SANITY_BLOG_AUTHOR_ID, // ensure this author exists
    },
    sources: sources.map((e) => ({
      _key: e.web?.uri,
      name: e.web?.title,
      uri: e.web?.uri,
    })),
    coverImage: {
      _type: "image",
      asset: { _type: "reference", _ref: imageAssetId },
      alt: slug,
    },
  };

  return client.create(doc);
}

export function getPost(id: string) {
  return client.fetch(postByIdQuery, { id });
}

export async function updatePostCoverImage(
  id: string,
  title: string,
  image: GoogleGenAIBlob
) {
  const slug = getSlug(title);
  console.log("Article slug:", slug);
  const imageAssetId = await uploadImage({ image, filename: slug });
  console.log("Cover image asset ID:", imageAssetId);
  return client
    .patch(id)
    .set({
      coverImage: {
        _type: "image",
        asset: { _type: "reference", _ref: imageAssetId },
      },
    })
    .commit();
}
