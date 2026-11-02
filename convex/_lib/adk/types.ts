import { z } from "zod";
import { GEMINI_MODELS } from "./models";

/**
 * Length presets for blog generation.
 * - brief: ~1,000 - 1,500 words (3-4 sections)
 * - standard: ~2,500 - 4,000 words (5-7 sections)
 * - deep_dive: ~5,000 - 8,000 words (8-12 sections)
 * - monograph: ~12,000 - 25,000 words (15-25 sections with H3 sub-sections)
 * - custom: explicitly driven by targetWordCount
 */
export const LengthPresetSchema = z.enum([
  "brief",
  "standard",
  "deep_dive",
  "monograph",
  "custom",
]);
export type LengthPreset = z.infer<typeof LengthPresetSchema>;

export const LengthBudgets: Record<
  Exclude<LengthPreset, "custom">,
  {
    targetWords: number;
    minSections: number;
    maxSections: number;
    avgWordsPerSection: number;
  }
> = {
  brief: {
    targetWords: 1200,
    minSections: 3,
    maxSections: 4,
    avgWordsPerSection: 350,
  },
  standard: {
    targetWords: 3000,
    minSections: 5,
    maxSections: 7,
    avgWordsPerSection: 500,
  },
  deep_dive: {
    targetWords: 6000,
    minSections: 8,
    maxSections: 12,
    avgWordsPerSection: 650,
  },
  monograph: {
    targetWords: 15000,
    minSections: 15,
    maxSections: 25,
    avgWordsPerSection: 800,
  },
};

/**
 * High-level configuration passed to the blog generation workflow.
 */
export const BlogGenerationConfigSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  instructions: z.string().optional(),
  lengthPreset: LengthPresetSchema.default("standard"),
  targetWordCount: z.number().min(100).optional(),
  model: z.string().default(GEMINI_MODELS.LATEST_FLASH),
  includeCoverImage: z.boolean().default(true),
  authorId: z.string().optional(),
});
export type BlogGenerationConfig = z.infer<typeof BlogGenerationConfigSchema>;

/**
 * Factual research dossier synthesized by the Researcher Agent.
 */
export const ResearchSourceSchema = z.object({
  title: z.string(),
  uri: z.string().url(),
  keyTakeaway: z.string().optional(),
});
export type ResearchSource = z.infer<typeof ResearchSourceSchema>;

export const ResearchDossierSchema = z.object({
  coreThesis: z.string().describe("The central finding or argument for this topic"),
  keyFacts: z
    .array(z.string())
    .describe("5-10 verified facts, statistics, or empirical data points"),
  emergingTrends: z
    .array(z.string())
    .describe("Recent developments, industry changes, or future outlook"),
  commonMisconceptions: z
    .array(z.string())
    .describe("Nuances, myths, or counterarguments to address"),
  recommendedKeywords: z
    .array(z.string())
    .describe("SEO long-tail keywords identified during research"),
  sources: z.array(ResearchSourceSchema).default([]),
});
export type ResearchDossier = z.infer<typeof ResearchDossierSchema>;

/**
 * Granular specification for each individual section of the blog post.
 */
export const SectionPlanSchema = z.object({
  id: z.string().describe("Short unique identifier e.g. 'sec-1-foundations'"),
  title: z.string().describe("Descriptive H2 heading for this section"),
  level: z.enum(["h2", "h3"]).default("h2"),
  targetWordCount: z.number().int().min(50).describe("Allocated word count budget"),
  coreObjective: z.string().describe("What key insight or answer this section delivers"),
  subpoints: z
    .array(z.string())
    .describe("Specific concepts, code examples, case studies, or arguments to elaborate"),
  transitionContext: z
    .string()
    .describe("How this connects forward to the next logical concept"),
});
export type SectionPlan = z.infer<typeof SectionPlanSchema>;

/**
 * Complete structural blueprint formulated by the Architect Agent.
 */
export const ArticleBlueprintSchema = z.object({
  workingTitle: z.string().describe("Compelling, working headline"),
  metaHook: z.string().describe("High-impact hook for introduction"),
  targetAudience: z.string().describe("Intended audience expertise and expectations"),
  toneAndStyle: z.string().describe("Writing style guidelines (e.g. authoritative, analytical)"),
  totalTargetWordCount: z.number().int().min(100),
  sections: z
    .array(SectionPlanSchema)
    .min(2, "At least 2 body sections are required"),
});
export type ArticleBlueprint = z.infer<typeof ArticleBlueprintSchema>;

/**
 * Output of drafting a single section.
 */
export const SectionDraftSchema = z.object({
  id: z.string(),
  title: z.string(),
  contentMarkdown: z.string(),
  wordCount: z.number().int(),
  tailSummary: z.string().describe("A brief 2-3 sentence summary of the section's conclusion to feed into the next section for seamless transition"),
});
export type SectionDraft = z.infer<typeof SectionDraftSchema>;

/**
 * SEO & Publication Metadata extracted by the SEO Specialist Agent.
 */
export const ArticleMetadataSchema = z.object({
  title: z.string().describe("Polished, high-CTR title (under 70 chars)"),
  slug: z.string().describe("URL-friendly kebab-case slug without special chars"),
  excerpt: z.string().describe("Summary under 160 characters for SERP and social share"),
  metaDescription: z.string().describe("SEO meta description with primary keyword under 160 chars"),
  keywords: z.array(z.string()).describe("Primary and secondary SEO keywords"),
  tags: z.array(z.string()).describe("Category tags"),
  estimatedReadingMinutes: z.number().int().min(1),
  wordCount: z.number().int().min(1),
});
export type ArticleMetadata = z.infer<typeof ArticleMetadataSchema>;

/**
 * Cover Image details.
 */
export const CoverImageResultSchema = z.object({
  prompt: z.string(),
  data: z.string().describe("Base64 encoded image data"),
  mimeType: z.string().describe("e.g. image/png or image/jpeg"),
});
export type CoverImageResult = z.infer<typeof CoverImageResultSchema>;

/**
 * Final assembled result of the blog generation workflow.
 */
export const BlogGenerationResultSchema = z.object({
  metadata: ArticleMetadataSchema,
  fullMarkdown: z.string(),
  sections: z.array(SectionDraftSchema),
  sources: z.array(ResearchSourceSchema),
  coverImage: CoverImageResultSchema.optional(),
  sanityPostId: z.string().optional(),
});
export type BlogGenerationResult = z.infer<typeof BlogGenerationResultSchema>;
