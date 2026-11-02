"use node";

import { GoogleSearchTool, LlmAgent, RetryConfig } from "@google/adk";
import { DEFAULT_TASK_MODELS } from "./models";
import {
  ARCHITECT_INSTRUCTION,
  EDITOR_INSTRUCTION,
  IMAGE_DIRECTOR_INSTRUCTION,
  RESEARCHER_INSTRUCTION,
  SECTION_WRITER_INSTRUCTION,
  SEO_INSTRUCTION,
} from "./prompts";
import {
  ArticleBlueprintSchema,
  ArticleMetadataSchema,
} from "./types";

export const defaultAgentRetryConfig: RetryConfig = {
  maxAttempts: 4,
  initialDelay: 2.0,
  maxDelay: 20.0,
  backoffFactor: 2.0,
};

export interface AgentOptions {
  model?: string;
  retryConfig?: RetryConfig;
  disableSearchTool?: boolean;
}

/**
 * 1. Researcher Agent
 * Uses Google Search Grounding to unearth verified facts, statistics,
 * recent updates, and authoritative sources.
 * Default Model: gemini-3.8-flash (T=0.2 for strict factual grounding)
 */
export function createResearcherAgent(opts: AgentOptions = {}) {
  const model = opts.model || DEFAULT_TASK_MODELS.research;
  const tools = opts.disableSearchTool ? [] : [new GoogleSearchTool()];
  return new LlmAgent({
    name: opts.disableSearchTool ? "researcher_agent_fallback" : "researcher_agent",
    model,
    retryConfig: opts.retryConfig || defaultAgentRetryConfig,
    description: "Conducts deep web research and factual grounding using Google Search.",
    instruction: RESEARCHER_INSTRUCTION,
    tools,
    generateContentConfig: {
      temperature: 0.2,
      maxOutputTokens: 16384,
    },
  });
}

/**
 * 2. Architect Agent
 * Decomposes the topic, user instructions, length budget, and research
 * into a structured, granular Article Blueprint with typed Zod output schema.
 * Default Model: gemini-3.8-flash (T=0.3 for schema adherence)
 */
export function createArchitectAgent(opts: AgentOptions = {}) {
  const model = opts.model || DEFAULT_TASK_MODELS.architect;
  return new LlmAgent({
    name: "architect_agent",
    model,
    retryConfig: opts.retryConfig || defaultAgentRetryConfig,
    description: "Designs the hierarchical narrative outline and allocates word budgets per section.",
    instruction: ARCHITECT_INSTRUCTION,
    outputSchema: ArticleBlueprintSchema as any,
    generateContentConfig: {
      temperature: 0.3,
      maxOutputTokens: 16384,
    },
  });
}

/**
 * 3. Section Writer Agent
 * Writes an exhaustive, high-fidelity draft for a single section.
 * Receives the global thesis, specific section plan, word budget, and preceding section tail.
 * Default Model: gemini-3.8-flash (T=0.7 for rich prose)
 */
export function createSectionWriterAgent(opts: AgentOptions = {}) {
  const model = opts.model || DEFAULT_TASK_MODELS.writer;
  return new LlmAgent({
    name: "section_writer_agent",
    model,
    retryConfig: opts.retryConfig || defaultAgentRetryConfig,
    description: "Drafts comprehensive, high-depth prose for an individual article section.",
    instruction: SECTION_WRITER_INSTRUCTION,
    generateContentConfig: {
      temperature: 0.7,
      maxOutputTokens: 16384,
    },
  });
}

/**
 * 4. Editor Agent
 * Polishes the entire stitched manuscript, harmonizes tone, crafts the
 * introduction and conclusion, and formats references.
 * Default Model: gemini-3.8-flash (T=0.4, 65k output tokens for arbitrary length)
 */
export function createEditorAgent(opts: AgentOptions = {}) {
  const model = opts.model || DEFAULT_TASK_MODELS.editor;
  return new LlmAgent({
    name: "editor_agent",
    model,
    retryConfig: opts.retryConfig || defaultAgentRetryConfig,
    description: "Performs editorial review, synthesizes Introduction and Conclusion, and unifies article tone.",
    instruction: EDITOR_INSTRUCTION,
    generateContentConfig: {
      temperature: 0.4,
      maxOutputTokens: 65536,
    },
  });
}

/**
 * 5. SEO & Metadata Specialist Agent
 * Extracts title, slug, excerpt, meta description, and keywords.
 * Default Model: gemini-3.8-flash (T=0.3 for concise CTR optimization)
 */
export function createSeoAgent(opts: AgentOptions = {}) {
  const model = opts.model || DEFAULT_TASK_MODELS.seo;
  return new LlmAgent({
    name: "seo_specialist_agent",
    model,
    retryConfig: opts.retryConfig || defaultAgentRetryConfig,
    description: "Extracts optimized SEO title, meta description, excerpt, slug, and tags.",
    instruction: SEO_INSTRUCTION,
    outputSchema: ArticleMetadataSchema as any,
    generateContentConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  });
}

/**
 * 6. Image Director Agent
 * Crafts an evocative visual metaphor prompt for the cover image.
 * Default Model: gemini-3.8-flash (T=0.8 for visual creativity)
 */
export function createImageDirectorAgent(opts: AgentOptions = {}) {
  const model = opts.model || DEFAULT_TASK_MODELS.imageDirector;
  return new LlmAgent({
    name: "image_director_agent",
    model,
    retryConfig: opts.retryConfig || defaultAgentRetryConfig,
    description: "Conceives an evocative artistic metaphor prompt for the article's cover image.",
    instruction: IMAGE_DIRECTOR_INSTRUCTION,
    generateContentConfig: {
      temperature: 0.8,
      maxOutputTokens: 2048,
    },
  });
}
