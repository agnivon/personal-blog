"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import * as adk from "./_lib/adk";
import * as legacyGenAi from "./_lib/google.genai";
import { createPost, getPost, updatePostCoverImage } from "./_lib/sanity";

/**
 * Generates an end-to-end blog article using the Google ADK 2.0 multi-agent workflow
 * and publishes it to Sanity CMS. Supports arbitrary length generation.
 */
export const generateArticle = internalAction({
  args: {
    topic: v.string(),
    instructions: v.optional(v.string()),
    lengthPreset: v.optional(v.string()), // "brief" | "standard" | "deep_dive" | "monograph" | "custom"
    targetWordCount: v.optional(v.number()),
    model: v.optional(v.string()),
    includeCoverImage: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`[ADK Action] Starting article generation for: "${args.topic}"`);

      const validPreset =
        args.lengthPreset &&
        ["brief", "standard", "deep_dive", "monograph", "custom"].includes(
          args.lengthPreset
        )
          ? (args.lengthPreset as adk.LengthPreset)
          : "standard";

      // 1. Run the ADK multi-agent workflow
      const result = await adk.runBlogGeneration({
        topic: args.topic,
        instructions: args.instructions,
        lengthPreset: validPreset,
        targetWordCount: args.targetWordCount,
        model: args.model || adk.GEMINI_MODELS.LATEST_FLASH,
        includeCoverImage: args.includeCoverImage !== false,
      });

      console.log(
        `[ADK Action] Workflow finished. Publishing "${result.metadata.title}" (${result.metadata.wordCount} words) to Sanity...`
      );

      // 2. Publish structured result directly to Sanity CMS
      const publishResult = await adk.publishResultToSanity(result);

      console.log(`[ADK Action] Successfully published post: ${publishResult.postId}`);

      return {
        _id: publishResult.postId,
        title: result.metadata.title,
        slug: publishResult.slug,
        excerpt: result.metadata.excerpt,
        wordCount: result.metadata.wordCount,
        coverImageGenerated: !!result.coverImage,
      };
    } catch (e) {
      console.error("[ADK Action] generateArticle failed:", e);
      throw e;
    }
  },
});

/**
 * Standalone action to generate article content without publishing.
 */
export const generateArticleContent = internalAction({
  args: {
    topic: v.string(),
    instructions: v.optional(v.string()),
    lengthPreset: v.optional(v.string()),
    targetWordCount: v.optional(v.number()),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const validPreset =
      args.lengthPreset &&
      ["brief", "standard", "deep_dive", "monograph", "custom"].includes(
        args.lengthPreset
      )
        ? (args.lengthPreset as adk.LengthPreset)
        : "standard";

    const result = await adk.runBlogGeneration({
      topic: args.topic,
      instructions: args.instructions,
      lengthPreset: validPreset,
      targetWordCount: args.targetWordCount,
      model: args.model || adk.GEMINI_MODELS.LATEST_FLASH,
      includeCoverImage: false,
    });

    return {
      text: result.fullMarkdown,
      metadata: result.metadata,
      sections: result.sections,
      sources: result.sources,
    };
  },
});

/**
 * Generates cover image using Gemini image generation.
 */
export const generateArticleCoverImage = internalAction({
  args: { title: v.string(), excerpt: v.string() },
  handler: async (ctx, args) => {
    const cover = await adk.generateCoverImage(args.title, args.excerpt);
    if (!cover) {
      // Fallback to legacy generator if ADK image helper returned undefined
      return legacyGenAi.generateArticleCoverImage(args.title, args.excerpt);
    }
    return {
      data: cover.data,
      mimeType: cover.mimeType,
    };
  },
});

/**
 * Legacy compatibility: structure article content using rule-based/regex parser.
 */
export const structureArticleContent = internalAction({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    return legacyGenAi.structureArticleContent(args.content);
  },
});

/**
 * Directly creates a blog post in Sanity CMS with all supplied arguments.
 * Rich text content is accepted in markdown format and converted to Portable Text blocks.
 */
export const uploadArticle = internalAction({
  args: {
    title: v.string(),
    content: v.string(),
    excerpt: v.optional(v.string()),
    coverImage: v.optional(
      v.union(
        v.object({
          data: v.string(),
          mimeType: v.string(),
        }),
        v.object({
          url: v.string(),
        })
      )
    ),
    slug: v.optional(v.string()),
    date: v.optional(v.string()),
    authorId: v.optional(v.string()),
    sources: v.optional(
      v.array(
        v.object({
          name: v.string(),
          uri: v.string(),
        })
      )
    ),
    hide: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const result = await createPost(args);
    return {
      _id: result._id,
      slug: result.slug,
      title: result.title,
    };
  },
});

/**
 * Re-generates and updates the cover image for an existing post.
 */
export const updateArticleCoverImage = internalAction({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const post = await getPost(args.id);
      if (!post) throw Error("Post not found");
      const image = await adk.generateCoverImage(
        post.title,
        post.excerpt || ""
      );
      if (!image) throw Error("Cover image generation failed");
      console.log("[ADK Action] Generated updated cover image");
      const result = await updatePostCoverImage(args.id, post.title, {
        data: image.data,
        mimeType: image.mimeType,
      });
      console.log(`[ADK Action] Updated cover image for post ${args.id}`);
      return result;
    } catch (e) {
      console.error("[ADK Action] updateArticleCoverImage error:", e);
      throw e;
    }
  },
});
