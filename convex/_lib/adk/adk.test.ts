import { describe, expect, it } from "vitest";
import {
  createArchitectAgent,
  createEditorAgent,
  createImageDirectorAgent,
  createResearcherAgent,
  createSectionWriterAgent,
  createSeoAgent,
} from "./agents";
import { DEFAULT_TASK_MODELS, GEMINI_MODELS, resolveTaskModels } from "./models";
import {
  ARCHITECT_INSTRUCTION,
  buildArchitectPrompt,
  buildCoverImagePrompt,
  buildEditorPrompt,
  buildImageDirectorPrompt,
  buildResearchPrompt,
  buildSectionWriterPrompt,
  buildSeoPrompt,
  COVER_IMAGE_INSTRUCTION,
  EDITOR_INSTRUCTION,
  IMAGE_DIRECTOR_INSTRUCTION,
  RESEARCHER_INSTRUCTION,
  SECTION_WRITER_INSTRUCTION,
  SEO_INSTRUCTION,
} from "./prompts";
import {
  cleanSlug,
  extractSourcesFromMarkdown,
  generateSanityKey,
  markdownToPortableText,
} from "./sanity-publisher";
import {
  ArticleBlueprintSchema,
  ArticleMetadataSchema,
  BlogGenerationConfigSchema,
  LengthBudgets,
  LengthPresetSchema,
} from "./types";
import { createBlogGenerationWorkflow } from "./workflow";

describe("ADK Blog Generation Schemas & Budgeting", () => {
  it("validates length presets and default configs with latest Gemini model", () => {
    expect(LengthPresetSchema.safeParse("brief").success).toBe(true);
    expect(LengthPresetSchema.safeParse("standard").success).toBe(true);
    expect(LengthPresetSchema.safeParse("deep_dive").success).toBe(true);
    expect(LengthPresetSchema.safeParse("monograph").success).toBe(true);
    expect(LengthPresetSchema.safeParse("invalid_preset").success).toBe(false);

    const parsedConfig = BlogGenerationConfigSchema.parse({
      topic: "Quantum Computing Algorithms",
    });
    expect(parsedConfig.lengthPreset).toBe("standard");
    expect(parsedConfig.model).toBe(GEMINI_MODELS.LATEST_FLASH);
    expect(parsedConfig.includeCoverImage).toBe(true);
  });

  it("verifies budget targets for all standard presets", () => {
    expect(LengthBudgets.brief.targetWords).toBe(1200);
    expect(LengthBudgets.standard.targetWords).toBe(3000);
    expect(LengthBudgets.deep_dive.targetWords).toBe(6000);
    expect(LengthBudgets.monograph.targetWords).toBe(15000);

    expect(LengthBudgets.monograph.minSections).toBeGreaterThanOrEqual(15);
  });

  it("validates ArticleBlueprintSchema structure", () => {
    const validBlueprint = {
      workingTitle: "Building Autonomous Agentic Systems",
      metaHook: "Why deterministic graphs are replacing brittle prompting chains.",
      targetAudience: "Senior software engineers and AI system architects",
      toneAndStyle: "Authoritative, analytical, with code and architectural depth",
      totalTargetWordCount: 3000,
      sections: [
        {
          id: "sec-1-limitations",
          title: "The Failure Modes of Monolithic Prompts",
          level: "h2",
          targetWordCount: 800,
          coreObjective: "Demonstrate context degradation in single-shot LLM calls",
          subpoints: ["Token budget limits", "Attention drift", "Lack of retry isolation"],
          transitionContext: "Bridges to graph-based execution architectures",
        },
        {
          id: "sec-2-graph-runtimes",
          title: "Deterministic Graphs and the ADK 2.0 Engine",
          level: "h2",
          targetWordCount: 1200,
          coreObjective: "Break down the mechanics of node-based state flow",
          subpoints: ["BaseNode lifecycle", "Dynamic scheduling", "Error recovery"],
          transitionContext: "Sets up practical implementation patterns",
        },
        {
          id: "sec-3-production-readiness",
          title: "Deploying and Monitoring Agent Workflows at Scale",
          level: "h2",
          targetWordCount: 1000,
          coreObjective: "Provide actionable production guidelines",
          subpoints: ["Telemetry with OpenTelemetry", "Session persistence", "Cost management"],
          transitionContext: "Concluding vision",
        },
      ],
    };

    const parsed = ArticleBlueprintSchema.safeParse(validBlueprint);
    expect(parsed.success).toBe(true);
  });

  it("validates ArticleMetadataSchema structure", () => {
    const validMetadata = {
      title: "How to Build Production AI Agents with Google ADK",
      slug: "how-to-build-production-ai-agents-google-adk",
      excerpt: "Explore the architectural shift from brittle prompts to deterministic graphs with Google ADK 2.0.",
      metaDescription: "Learn how to build scalable, high-fidelity AI agents using Google ADK 2.0 in TypeScript.",
      keywords: ["google adk", "multi-agent systems", "typescript ai", "llm workflows"],
      tags: ["AI", "Software Architecture", "TypeScript"],
      estimatedReadingMinutes: 12,
      wordCount: 2850,
    };

    const parsed = ArticleMetadataSchema.safeParse(validMetadata);
    expect(parsed.success).toBe(true);
  });
});

describe("Model Registry & Configuration", () => {
  it("defaults to latest Gemini models for all tasks", () => {
    expect(DEFAULT_TASK_MODELS.research).toBe("gemini-3.8-flash");
    expect(DEFAULT_TASK_MODELS.architect).toBe("gemini-3.8-flash");
    expect(DEFAULT_TASK_MODELS.writer).toBe("gemini-3.8-flash");
    expect(DEFAULT_TASK_MODELS.editor).toBe("gemini-3.8-flash");
    expect(DEFAULT_TASK_MODELS.seo).toBe("gemini-3.8-flash");
    expect(DEFAULT_TASK_MODELS.imageDirector).toBe("gemini-3.8-flash");
    expect(DEFAULT_TASK_MODELS.imageGeneration).toBe("gemini-2.5-flash-image");
  });

  it("supports global and granular model overrides", () => {
    const globalOverride = resolveTaskModels("gemini-2.5-flash");
    expect(globalOverride.writer).toBe("gemini-2.5-flash");
    expect(globalOverride.architect).toBe("gemini-2.5-flash");
    expect(globalOverride.imageGeneration).toBe("gemini-2.5-flash-image");

    const granularOverride = resolveTaskModels({
      writer: "gemini-3.1-pro-preview",
    });
    expect(granularOverride.writer).toBe("gemini-3.1-pro-preview");
    expect(granularOverride.research).toBe(GEMINI_MODELS.LATEST_FLASH);
  });
});

describe("Prompts File & Template Builders", () => {
  it("contains all required system instructions", () => {
    expect(RESEARCHER_INSTRUCTION).toContain("google_search");
    expect(ARCHITECT_INSTRUCTION).toContain("structural blueprint");
    expect(SECTION_WRITER_INSTRUCTION).toContain("WORD COUNT BUDGET");
    expect(EDITOR_INSTRUCTION).toContain("Introduction");
    expect(SEO_INSTRUCTION).toContain("publication metadata");
    expect(IMAGE_DIRECTOR_INSTRUCTION).toContain("ABSOLUTELY NO TEXT");
    expect(COVER_IMAGE_INSTRUCTION).toContain("ZERO TEXT / TYPOGRAPHY");
  });

  it("builds consistent prompts with provided context", () => {
    const researchPrompt = buildResearchPrompt({
      topic: "Event-Driven Microservices",
      totalTargetWords: 3000,
      minSections: 5,
      maxSections: 7,
    });
    expect(researchPrompt).toContain('Topic: "Event-Driven Microservices"');
    expect(researchPrompt).toContain("~3000 words");

    const architectPrompt = buildArchitectPrompt({
      topic: "Event-Driven Microservices",
      totalTargetWords: 3000,
      minSections: 5,
      maxSections: 7,
      avgWordsPerSection: 500,
      researchDossier: "Sample Dossier",
    });
    expect(architectPrompt).toContain("Sample Dossier");
    expect(architectPrompt).toContain("Target Total Words: 3000");

    const writerPrompt = buildSectionWriterPrompt({
      workingTitle: "Microservices Masterclass",
      metaHook: "Decoupling at scale",
      toneAndStyle: "Technical",
      sectionIndex: 1,
      totalSections: 5,
      section: {
        title: "Event Streaming Patterns",
        targetWordCount: 600,
        coreObjective: "Explain log-based message queues",
        subpoints: ["Compacted topics", "Consumer groups"],
        transitionContext: "Bridges to stateful stream processing",
      },
    });
    expect(writerPrompt).toContain('Section Title: "Event Streaming Patterns"');
    expect(writerPrompt).toContain("EXACTLY 600 words");

    const coverPrompt = buildCoverImagePrompt({
      title: "Microservices Masterclass",
      excerpt: "Decoupling at scale",
      visualMetaphor: "An intricate glowing glass circuit",
    });
    expect(coverPrompt).toContain("An intricate glowing glass circuit");
    expect(coverPrompt).toContain("ZERO text");
  });
});

describe("Slug & Portable Text Formatting", () => {
  it("cleans problematic titles into URL-safe slugs and caps length at 96", () => {
    expect(cleanSlug("Beyond the Code: Why Next-Gen AI Agents Win?")).toBe(
      "beyond-the-code-why-next-gen-ai-agents-win"
    );
    expect(cleanSlug("  Special & Characters #123 --- Test!  ")).toBe(
      "special-characters-123-test"
    );
    expect(cleanSlug("AI 2.0: The Future of Work (And You)")).toBe(
      "ai-20-the-future-of-work-and-you"
    );

    const overlyLongTitle =
      "Building Highly Scalable Autonomous Agentic Multi-Agent Graph Architectures Using TypeScript and Google ADK 2.0 for Next-Generation Distributed Systems and Production Deployments";
    const capped = cleanSlug(overlyLongTitle);
    expect(capped.length).toBeLessThanOrEqual(96);
    expect(capped.endsWith("-")).toBe(false);
  });

  it("generates schema-compliant alphanumeric Sanity array keys", () => {
    const key1 = generateSanityKey("https://example.com/blog/my-post?ref=test#section", 0);
    expect(key1).toMatch(/^[a-zA-Z0-9_-]+$/);
    expect(key1).not.toContain(":");
    expect(key1).not.toContain("/");
    expect(key1).not.toContain("?");

    const key2 = generateSanityKey(undefined, 1);
    expect(key2).toMatch(/^[a-zA-Z0-9_-]+$/);
  });

  it("extracts, parses, and deduplicates research sources from markdown", () => {
    const markdown = `
# Autonomous Agents

## Authoritative Sources & Citations
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- Google Cloud Architecture: https://cloud.google.com/architecture
- https://adk.dev/
- [Next.js App Router Documentation](https://nextjs.org/docs/app#sub)
`;
    const sources = extractSourcesFromMarkdown(markdown);
    expect(sources.length).toBe(3);
    expect(sources[0]).toEqual({
      title: "Next.js App Router Documentation",
      uri: "https://nextjs.org/docs/app",
    });
    expect(sources[1]).toEqual({
      title: "Google Cloud Architecture",
      uri: "https://cloud.google.com/architecture",
    });
    expect(sources[2]).toEqual({
      title: "adk.dev",
      uri: "https://adk.dev",
    });
  });

  it("converts sample markdown into Sanity Portable Text blocks", () => {
    const sampleMarkdown = `
# Title

## Introduction
This is a test introduction paragraph with **bold** text and [a link](https://adk.dev).

* Item 1
* Item 2
* Item 3

## Deep Dive
Another paragraph explaining the concept in detail.
`;
    const blocks = markdownToPortableText(sampleMarkdown);
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks.length).toBeGreaterThan(0);
  });
});

describe("ADK Agents & Workflow Instantiation", () => {
  it("instantiates all specialized ADK agents with latest models by default", () => {
    const researcher = createResearcherAgent();
    expect(researcher.name).toBe("researcher_agent");
    expect(researcher.model).toBe(GEMINI_MODELS.LATEST_FLASH);
    expect(researcher.tools.length).toBe(1);

    const fallbackResearcher = createResearcherAgent({ disableSearchTool: true });
    expect(fallbackResearcher.name).toBe("researcher_agent_fallback");
    expect(fallbackResearcher.tools.length).toBe(0);

    const architect = createArchitectAgent();
    expect(architect.name).toBe("architect_agent");
    expect(architect.model).toBe(GEMINI_MODELS.LATEST_FLASH);

    const writer = createSectionWriterAgent();
    expect(writer.name).toBe("section_writer_agent");
    expect(writer.model).toBe(GEMINI_MODELS.LATEST_FLASH);
    expect(writer.generateContentConfig?.temperature).toBe(0.7);

    const editor = createEditorAgent();
    expect(editor.name).toBe("editor_agent");
    expect(editor.model).toBe(GEMINI_MODELS.LATEST_FLASH);
    expect(editor.generateContentConfig?.maxOutputTokens).toBe(65536);
    expect(editor.generateContentConfig?.temperature).toBe(0.4);

    const seo = createSeoAgent();
    expect(seo.name).toBe("seo_specialist_agent");
    expect(seo.model).toBe(GEMINI_MODELS.LATEST_FLASH);
    expect(seo.generateContentConfig?.temperature).toBe(0.3);

    const imageDirector = createImageDirectorAgent();
    expect(imageDirector.name).toBe("image_director_agent");
    expect(imageDirector.model).toBe(GEMINI_MODELS.LATEST_FLASH);
    expect(imageDirector.generateContentConfig?.temperature).toBe(0.8);
  });

  it("constructs the master ADK Workflow object", () => {
    const workflow = createBlogGenerationWorkflow();
    expect(workflow.name).toBe("blog_generation_workflow");
    expect(workflow.dynamicEntry).toBeDefined();
  });
});
