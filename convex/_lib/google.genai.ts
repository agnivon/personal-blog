"use node";

import {
  GenerateContentConfig,
  GenerateContentResponse,
  GoogleGenAI,
  Modality,
} from "@google/genai";
import z from "zod";
import {
  blogCoverImageGenerationSystemInstruction,
  blogGenerationSystemInstruction,
  blogProcessingSystemInstruction,
  blogTitleAndExcerptResponseSchema,
  blogTitleAndExcerptSystemInstruction,
  processedBlogResponseSchema,
} from "../_constants/prompts";
// Configure the client
const ai = new GoogleGenAI({});

// Define the grounding tool
const groundingTool = {
  googleSearch: {},
};

function addCitations(response: GenerateContentResponse) {
  let text = response.text || "";
  const supports =
    response.candidates?.[0]?.groundingMetadata?.groundingSupports || [];
  const chunks =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  if (supports.length == 0 || chunks.length == 0) {
    return text;
  }

  // Sort supports by end_index in descending order to avoid shifting issues when inserting.
  const sortedSupports = [...supports].sort(
    (a, b) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0)
  );

  for (const support of sortedSupports) {
    const endIndex = support.segment?.endIndex;
    if (endIndex === undefined || !support.groundingChunkIndices?.length) {
      continue;
    }

    const citationLinks = support.groundingChunkIndices
      .map((i) => {
        const uri = chunks[i]?.web?.uri;
        if (uri) {
          return `[${i + 1}](${uri})`;
        }
        return null;
      })
      .filter(Boolean);

    if (citationLinks.length > 0) {
      const citationString = citationLinks.join(", ");
      text = text.slice(0, endIndex) + citationString + text.slice(endIndex);
    }
  }

  /* const sourcesText =
      "\n##Sources\n" +
      chunks
        .map((e, i) => `${i + 1}. [${e.web?.title}](${e.web?.uri})`)
        .join("\n");

    text += sourcesText; */

  return text;
}

export async function generateArticleContent(
  topic: string,
  instructions?: string
) {
  // Configure generation settings
  const config: GenerateContentConfig = {
    systemInstruction: blogGenerationSystemInstruction,
    tools: [groundingTool],
    maxOutputTokens: 65536,
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Generate a blog post for the topic: ${topic}.\nAdditional Instructions: ${instructions || "No additional instructions"}`,
    config,
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
  };
}

export async function generateArticleTitleAndExcerpt(content: string) {
  // Configure generation settings
  const config: GenerateContentConfig = {
    systemInstruction: blogTitleAndExcerptSystemInstruction,
    responseMimeType: "application/json",
    responseSchema: blogTitleAndExcerptResponseSchema,
    maxOutputTokens: 65536,
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Generate a title and excerpt for this blog:\n${content}`,
    config,
  });
  return z
    .object({
      title: z.string(),
      excerpt: z.string(),
    })
    .parse(JSON.parse(response.text || ""));
}

export async function extractArticleTitleAndExcerpt(content: string) {
  // Configure generation settings
  const config: GenerateContentConfig = {
    systemInstruction: blogProcessingSystemInstruction,
    responseMimeType: "application/json",
    responseSchema: processedBlogResponseSchema,
    maxOutputTokens: 65536,
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Extract the title and excerpt for this blog:\n${content}`,
    config,
  });
  return z
    .object({
      title: z.string(),
      excerpt: z.string(),
    })
    .parse(JSON.parse(response.text || ""));
}

export async function generateArticleCoverImage(
  title: string,
  excerpt: string
) {
  const config: GenerateContentConfig = {
    // systemInstruction: blogCoverImageGenerationSystemInstruction,
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
      // Based on the part type, either show the text or save the image
      if (part.inlineData) {
        const imageData = part.inlineData;
        return imageData;
      }
    }
  }
}

export async function structureArticleContent(articleContent: string) {
  // 1. Extract the Title
  // The title is assumed to be the first line, starting with '# '.
  const lines = articleContent.trim().split("\n");
  const title = lines[0]?.replace(/^#\s*/, "").trim() ?? "";

  // 2. Extract the Meta Description
  // Use a regular expression to find the text between "## Meta Description" and the next heading.
  // The 's' flag allows '.' to match newline characters.
  const metaDescriptionMatch = articleContent.match(
    /## Meta Description\s*\n([\s\S]*?)\n##/s
  );
  const metaDescription = metaDescriptionMatch?.[1]?.trim() ?? "";

  // 3. Find the start of the main content
  // We define the main content as everything from "## Introduction" onwards.
  const introductionMarker = "## Introduction";
  const contentStartIndex = articleContent.indexOf(introductionMarker);

  // 4. Extract and trim the content
  // If the introduction marker is found, slice the string from that point.
  // Otherwise, return an empty string to prevent errors.
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
