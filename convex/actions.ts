"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import * as genai from "./_lib/google.genai";
import { createPost, getPost, updatePostCoverImage } from "./_lib/sanity";

export const generateArticleContent = internalAction({
  args: { topic: v.string(), instructions: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return genai.generateArticleContent(args.topic, args.instructions);
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
    instructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const { text: content, sources } = await genai.generateArticleContent(
        args.topic,
        args.instructions
      );
      if (!content) throw Error("Article content generation failed");
      console.log("Generated content");
      const titleAndExcerpt =
        await genai.extractArticleTitleAndExcerpt(content);
      // console.log(titleAndExcerpt);
      if (!titleAndExcerpt) throw Error("Article structuring failed");
      const { title, excerpt } = titleAndExcerpt;
      console.log(`Generated title: ${title} and excerpt: ${excerpt}`);
      //   console.log({ title, excerpt, content });
      const image = await genai.generateArticleCoverImage(title, excerpt);
      if (!image) throw Error("Cover image generation failed");
      console.log("Generated cover image");
      /* if (image.data) {
      const buffer = Buffer.from(image.data, "base64");
      const blob = new Blob([buffer], { type: image.mimeType });
      await ctx.storage.store(blob);
    } */
      const result = await createPost({
        title,
        excerpt,
        content,
        sources,
        image,
      });
      console.log(`Created post ${result._id}`);
      return result;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
});

export const updateArticleCoverImage = internalAction({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const post = await getPost(args.id);
      if (!post) throw Error("Post not found");
      const image = await genai.generateArticleCoverImage(
        post.title,
        post.excerpt || ""
      );
      if (!image) throw Error("Cover image generation failed");
      console.log("Generated cover image");
      const result = await updatePostCoverImage(args.id, post.title, image);
      console.log(`Updated cover image for post ${args.id}`);
      return result;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
});
