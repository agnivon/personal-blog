"use node";

import { GenerateContentConfig, GoogleGenAI, Modality } from "@google/genai";
import { GEMINI_MODELS } from "./models";
import { buildCoverImagePrompt } from "./prompts";
import { CoverImageResult } from "./types";

const ai = new GoogleGenAI({});

/**
 * Generates an artistic, text-free cover image using the latest Gemini native image model.
 */
export async function generateCoverImage(
  title: string,
  excerpt: string,
  visualConceptPrompt?: string,
  model: string = GEMINI_MODELS.LATEST_IMAGE
): Promise<CoverImageResult | undefined> {
  try {
    const config: GenerateContentConfig = {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    };

    const finalPrompt = buildCoverImagePrompt({
      title,
      excerpt,
      visualMetaphor: visualConceptPrompt,
    });

    const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
      config,
    });

    const parts = response?.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return {
            prompt: finalPrompt,
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || "image/png",
          };
        }
      }
    }

    console.warn("[ADK Image Node] No inline image data returned from image model");
    return undefined;
  } catch (err) {
    console.warn("[ADK Image Node] Image generation failed gracefully:", err);
    return undefined;
  }
}
