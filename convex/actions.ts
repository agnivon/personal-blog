"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import * as genai from "./_lib/google.genai";
import { createPost } from "./_lib/sanity";

export const generateArticleContent = internalAction({
  args: { topic: v.string() },
  handler: async (ctx, args) => {
    return genai.generateArticleContent(args.topic);
  },
});

export const generateArticleCoverImage = internalAction({
  args: { title: v.string(), excerpt: v.string() },
  handler: async (ctx, args) => {
    return genai.generateArticleCoverImage(args.title, args.excerpt);
  },
});

export const structureArticleContent = internalAction({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    return genai.structureArticleContent(args.content);
  },
});

export const uploadArticle = internalAction({
  args: {
    title: v.string(),
    excerpt: v.string(),
    content: v.string(),
    image: v.object({
      data: v.string(),
      mimeType: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const result = await createPost(args);
    return result;
  },
});

export const generateArticle = internalAction({
  args: {
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const content = await genai.generateArticleContent(args.topic);
      if (!content) throw Error("Article content generation failed");
      const titleAndExcerpt =
        await genai.extractArticleTitleAndExcerpt(content);
      //   console.log(titleAndExcerpt);
      if (!titleAndExcerpt) throw Error("Article structuring failed");
      const { title, excerpt } = titleAndExcerpt;
      //   console.log({ title, excerpt, content });
      const image = await genai.generateArticleCoverImage(title, excerpt);
      if (!image) throw Error("Cover image generation failed");
      /* if (image.data) {
      const buffer = Buffer.from(image.data, "base64");
      const blob = new Blob([buffer], { type: image.mimeType });
      await ctx.storage.store(blob);
    } */
      const result = await createPost({ title, excerpt, content, image });
      console.log(`Created post ${result._id}`);
      return result;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
});
