"use node";

import {
  GenerateContentConfig,
  GoogleGenAI,
  Modality,
} from "@google/genai";
import { blogCoverImageGenerationSystemInstruction } from "../_constants/prompts";

// Configure the client
const ai = new GoogleGenAI({});

export async function generateArticleCoverImage(
  title: string,
  excerpt: string
) {
  const config: GenerateContentConfig = {
    responseModalities: [Modality.TEXT, Modality.IMAGE],
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents: `${blogCoverImageGenerationSystemInstruction} \n Generate a blog cover image for a post titled: ${title} and excerpt: ${excerpt}`,
    config: config,
  });
  const content = response?.candidates?.[0]?.content;
  if (content?.parts) {
    for (const part of content.parts) {
      if (part.inlineData) {
        return part.inlineData;
      }
    }
  }
}

export async function structureArticleContent(articleContent: string) {
  const lines = articleContent.trim().split("\n");
  const title = lines[0]?.replace(/^#\s*/, "").trim() ?? "";

  const metaDescriptionMatch = articleContent.match(
    /## Meta Description\s*\n([\s\S]*?)\n##/s
  );
  const metaDescription = metaDescriptionMatch?.[1]?.trim() ?? "";

  const introductionMarker = "## Introduction";
  const contentStartIndex = articleContent.indexOf(introductionMarker);

  const content =
    contentStartIndex !== -1
      ? articleContent.substring(contentStartIndex).trim()
      : "";

  return {
    title,
    metaDescription,
    content,
  };
}
