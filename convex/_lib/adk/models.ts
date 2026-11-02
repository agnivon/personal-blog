/**
 * Central registry of Google Gemini models optimized for multi-agent workflows.
 * Configured with the latest generation Gemini models available in Google GenAI SDK.
 */
export const GEMINI_MODELS = {
  /**
   * Latest, fastest, and most cost-effective reasoning model.
   * Superior instruction following, long context window, and low latency.
   */
  LATEST_FLASH: "gemini-3.8-flash",

  /**
   * High-reliability fallback flash model.
   */
  STABLE_FLASH: "gemini-2.5-flash",

  /**
   * Deep reasoning and analytical flagship model.
   */
  PRO_PREVIEW: "gemini-3.1-pro-preview",

  /**
   * Native image generation model for cover art.
   */
  LATEST_IMAGE: "gemini-2.5-flash-image",
  IMAGE_3_1: "gemini-3.1-flash-image",
} as const;

export interface TaskModelConfig {
  research: string;
  architect: string;
  writer: string;
  editor: string;
  seo: string;
  imageDirector: string;
  imageGeneration: string;
}

/**
 * Default model assignments tailored for each specialist agent.
 * Uses the latest Gemini 3.8 Flash model by default across text, reasoning,
 * and coding steps for maximum fidelity and throughput, and Gemini 2.5 Flash Image
 * for multimodal cover art generation.
 */
export const DEFAULT_TASK_MODELS: TaskModelConfig = {
  research: GEMINI_MODELS.LATEST_FLASH,
  architect: GEMINI_MODELS.LATEST_FLASH,
  writer: GEMINI_MODELS.LATEST_FLASH,
  editor: GEMINI_MODELS.LATEST_FLASH,
  seo: GEMINI_MODELS.LATEST_FLASH,
  imageDirector: GEMINI_MODELS.LATEST_FLASH,
  imageGeneration: GEMINI_MODELS.LATEST_IMAGE,
};

/**
 * Resolves a model mapping with fallbacks and optional user overrides.
 */
export function resolveTaskModels(override?: Partial<TaskModelConfig> | string): TaskModelConfig {
  if (typeof override === "string") {
    const trimmed = override.trim();
    if (trimmed) {
      return {
        research: trimmed,
        architect: trimmed,
        writer: trimmed,
        editor: trimmed,
        seo: trimmed,
        imageDirector: trimmed,
        imageGeneration: DEFAULT_TASK_MODELS.imageGeneration,
      };
    }
    return DEFAULT_TASK_MODELS;
  }

  if (override && typeof override === "object") {
    return {
      ...DEFAULT_TASK_MODELS,
      ...override,
    };
  }

  return DEFAULT_TASK_MODELS;
}
