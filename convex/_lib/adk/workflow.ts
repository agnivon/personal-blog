import { InMemoryRunner, NodeContext, Workflow } from "@google/adk";
import {
  createArchitectAgent,
  createEditorAgent,
  createImageDirectorAgent,
  createResearcherAgent,
  createSectionWriterAgent,
  createSeoAgent,
} from "./agents";
import { generateCoverImage } from "./image";
import { resolveTaskModels } from "./models";
import {
  buildArchitectPrompt,
  buildEditorPrompt,
  buildImageDirectorPrompt,
  buildResearchPrompt,
  buildSectionWriterPrompt,
  buildSeoPrompt,
} from "./prompts";
import { extractSourcesFromMarkdown } from "./sanity-publisher";
import {
  ArticleBlueprint,
  ArticleBlueprintSchema,
  ArticleMetadata,
  ArticleMetadataSchema,
  BlogGenerationConfig,
  BlogGenerationConfigSchema,
  BlogGenerationResult,
  CoverImageResult,
  LengthBudgets,
  SectionDraft,
} from "./types";

/**
 * Calculates target words and recommended section range based on config.
 */
function resolveLengthParameters(config: BlogGenerationConfig): {
  totalTargetWords: number;
  minSections: number;
  maxSections: number;
  avgWordsPerSection: number;
} {
  if (config.lengthPreset === "custom" && config.targetWordCount) {
    const total = config.targetWordCount;
    // Scale section count proportionally (approx 500-800 words per section)
    const estimatedSections = Math.max(
      2,
      Math.min(30, Math.round(total / 650))
    );
    return {
      totalTargetWords: total,
      minSections: Math.max(2, estimatedSections - 1),
      maxSections: estimatedSections + 2,
      avgWordsPerSection: Math.round(total / estimatedSections),
    };
  }

  const preset =
    config.lengthPreset === "custom" ? "standard" : config.lengthPreset;
  const budget = LengthBudgets[preset] || LengthBudgets.standard;
  return {
    totalTargetWords: budget.targetWords,
    minSections: budget.minSections,
    maxSections: budget.maxSections,
    avgWordsPerSection: budget.avgWordsPerSection,
  };
}

/**
 * Extracts helper string content from any node output.
 */
function extractOutputText(output: unknown): string {
  if (typeof output === "string") return output;
  if (!output) return "";
  if (typeof output === "object") {
    return JSON.stringify(output);
  }
  return String(output);
}

/**
 * Creates the ADK Blog Generation Workflow.
 */
export function createBlogGenerationWorkflow(): Workflow {
  return new Workflow({
    name: "blog_generation_workflow",
    description:
      "Hierarchical, high-fidelity blog generation workflow supporting arbitrary length.",
    dynamicEntry: async (
      ctx: NodeContext,
      nodeInput: unknown
    ): Promise<BlogGenerationResult> => {
      // 0. Parse & Normalize Input Configuration
      let rawConfig: unknown = nodeInput;
      if (typeof nodeInput === "string") {
        try {
          rawConfig = JSON.parse(nodeInput);
        } catch {
          rawConfig = { topic: nodeInput };
        }
      }
      const config = BlogGenerationConfigSchema.parse(rawConfig);
      const lengthParams = resolveLengthParameters(config);
      const taskModels = resolveTaskModels(config.model);

      console.info(
        `[ADK Blog Workflow] Starting generation for topic: "${config.topic}" (Preset: ${config.lengthPreset}, Target: ~${lengthParams.totalTargetWords} words)`
      );
      console.info(
        `[ADK Blog Workflow] Active models: Text/Reasoning: "${taskModels.writer}" | Image: "${taskModels.imageGeneration}"`
      );

      const researcherAgent = createResearcherAgent({ model: taskModels.research });
      const architectAgent = createArchitectAgent({ model: taskModels.architect });
      const sectionWriterAgent = createSectionWriterAgent({
        model: taskModels.writer,
      });
      const editorAgent = createEditorAgent({ model: taskModels.editor });
      const seoAgent = createSeoAgent({ model: taskModels.seo });
      const imageDirectorAgent = createImageDirectorAgent({
        model: taskModels.imageDirector,
      });

      // 1. Research Phase (with Grounding Tool + Resilience Fallback)
      console.info("[ADK Blog Workflow] Phase 1: Conducting deep grounded research...");
      const researchPrompt = buildResearchPrompt({
        topic: config.topic,
        instructions: config.instructions,
        totalTargetWords: lengthParams.totalTargetWords,
        minSections: lengthParams.minSections,
        maxSections: lengthParams.maxSections,
      });

      let researchDossier = "";
      try {
        const researchResult = await ctx.runNode(researcherAgent, researchPrompt, {
          nodeName: "researcher",
          runId: "research",
        });
        researchDossier = extractOutputText(researchResult.output);
      } catch (researchError) {
        console.warn(
          "[ADK Blog Workflow] Grounded search encountered an error or quota exhaustion. Falling back to internal knowledge synthesis...",
          researchError
        );
        const fallbackResearcher = createResearcherAgent({
          model: taskModels.research,
          disableSearchTool: true,
        });
        const fallbackResult = await ctx.runNode(
          fallbackResearcher,
          researchPrompt,
          {
            nodeName: "researcher_fallback",
            runId: "research_fallback",
          }
        );
        researchDossier = extractOutputText(fallbackResult.output);
      }

      // 2. Architectural Blueprint Phase
      console.info("[ADK Blog Workflow] Phase 2: Formulating architectural blueprint...");
      const architectPrompt = buildArchitectPrompt({
        topic: config.topic,
        instructions: config.instructions,
        totalTargetWords: lengthParams.totalTargetWords,
        minSections: lengthParams.minSections,
        maxSections: lengthParams.maxSections,
        avgWordsPerSection: lengthParams.avgWordsPerSection,
        researchDossier,
      });

      const blueprintResult = await ctx.runNode(
        architectAgent,
        architectPrompt,
        {
          nodeName: "architect",
          runId: "blueprint",
        }
      );

      let blueprint: ArticleBlueprint;
      if (
        blueprintResult.output &&
        typeof blueprintResult.output === "object" &&
        "sections" in (blueprintResult.output as Record<string, unknown>)
      ) {
        blueprint = ArticleBlueprintSchema.parse(blueprintResult.output);
      } else {
        // Fallback parse if returned as raw JSON string
        blueprint = ArticleBlueprintSchema.parse(
          JSON.parse(extractOutputText(blueprintResult.output))
        );
      }

      console.info(
        `[ADK Blog Workflow] Blueprint finalized: "${blueprint.workingTitle}" with ${blueprint.sections.length} planned sections.`
      );

      // 3. Cover Image Conceptualization (Initiate in parallel)
      let coverImagePromise: Promise<CoverImageResult | undefined> =
        Promise.resolve(undefined);

      if (config.includeCoverImage) {
        coverImagePromise = (async () => {
          try {
            console.info("[ADK Blog Workflow] Phase 3A: Conceptualizing visual cover metaphor...");
            const imageDirectorPrompt = buildImageDirectorPrompt({
              workingTitle: blueprint.workingTitle,
              metaHook: blueprint.metaHook,
              targetAudience: blueprint.targetAudience,
              toneAndStyle: blueprint.toneAndStyle,
            });

            const imagePromptResult = await ctx.runNode(
              imageDirectorAgent,
              imageDirectorPrompt,
              {
                nodeName: "image_director",
                runId: "cover_concept",
              }
            );

            const visualConcept = extractOutputText(imagePromptResult.output);
            console.info("[ADK Blog Workflow] Phase 3B: Generating cover image asset...");
            return await generateCoverImage(
              blueprint.workingTitle,
              blueprint.metaHook,
              visualConcept,
              taskModels.imageGeneration
            );
          } catch (e) {
            console.warn("[ADK Blog Workflow] Cover image generation warning:", e);
            return undefined;
          }
        })();
      }

      // 4. Dynamic Section-by-Section Drafting Loop
      console.info(
        `[ADK Blog Workflow] Phase 4: Drafting ${blueprint.sections.length} sections iteratively...`
      );
      const draftedSections: SectionDraft[] = [];
      let previousSectionTail = "";

      for (let i = 0; i < blueprint.sections.length; i++) {
        const section = blueprint.sections[i];
        console.info(
          `[ADK Blog Workflow] Drafting section ${i + 1}/${blueprint.sections.length}: "${section.title}" (Budget: ~${section.targetWordCount} words)`
        );

        const sectionPrompt = buildSectionWriterPrompt({
          workingTitle: blueprint.workingTitle,
          metaHook: blueprint.metaHook,
          toneAndStyle: blueprint.toneAndStyle,
          sectionIndex: i + 1,
          totalSections: blueprint.sections.length,
          section,
          previousSectionTail,
          researchNotes: researchDossier,
        });

        const sectionRunResult = await ctx.runNode(
          sectionWriterAgent,
          sectionPrompt,
          {
            nodeName: "section_writer",
            runId: `sec_${i + 1}_${section.id}`,
          }
        );

        const contentMarkdown = extractOutputText(sectionRunResult.output);
        const words = contentMarkdown
          .trim()
          .split(/\s+/)
          .filter(Boolean).length;

        // Keep last 120 words as the rolling bridge for the next section
        const wordsArray = contentMarkdown.trim().split(/\s+/);
        const tailSlice = wordsArray.slice(-120).join(" ");

        previousSectionTail = tailSlice;

        draftedSections.push({
          id: section.id,
          title: section.title,
          contentMarkdown,
          wordCount: words,
          tailSummary: tailSlice,
        });

        console.info(
          `[ADK Blog Workflow] Completed section ${i + 1}/${blueprint.sections.length} (${words} words)`
        );
      }

      // 5. Editorial Polish & Synthesis Phase
      console.info("[ADK Blog Workflow] Phase 5: Editorial polish and seamless synthesis...");
      const assembledBodyMarkdown = draftedSections
        .map((s) => s.contentMarkdown)
        .join("\n\n");

      const editorPrompt = buildEditorPrompt({
        workingTitle: blueprint.workingTitle,
        metaHook: blueprint.metaHook,
        targetAudience: blueprint.targetAudience,
        sectionCount: draftedSections.length,
        assembledBodyMarkdown,
        researchDossier,
      });

      const editorResult = await ctx.runNode(editorAgent, editorPrompt, {
        nodeName: "editor",
        runId: "editorial_synthesis",
      });

      const editorOutput = extractOutputText(editorResult.output);
      const assembledWordCount = assembledBodyMarkdown.split(/\s+/).filter(Boolean).length;
      const editorWordCount = editorOutput.split(/\s+/).filter(Boolean).length;

      let fullMarkdown = editorOutput;
      if (editorWordCount < assembledWordCount * 0.6 && assembledWordCount > 800) {
        console.warn(
          `[ADK Blog Workflow] Editorial synthesis output (${editorWordCount} words) condensed the manuscript below 60% of drafted sections (${assembledWordCount} words). Recombining to preserve full section depth...`
        );
        fullMarkdown = `# ${blueprint.workingTitle}\n\n${assembledBodyMarkdown}\n\n## Sources & Further Reading\n${researchDossier}`;
      }

      console.info(
        `[ADK Blog Workflow] Full manuscript finalized (${fullMarkdown.split(/\s+/).length} total words).`
      );

      // 6. SEO & Metadata Extraction Phase
      console.info("[ADK Blog Workflow] Phase 6: Extracting publication and SEO metadata...");
      const seoPrompt = buildSeoPrompt(fullMarkdown);

      const seoResult = await ctx.runNode(seoAgent, seoPrompt, {
        nodeName: "seo_specialist",
        runId: "metadata_extraction",
      });

      let metadata: ArticleMetadata;
      if (
        seoResult.output &&
        typeof seoResult.output === "object" &&
        "title" in (seoResult.output as Record<string, unknown>)
      ) {
        metadata = ArticleMetadataSchema.parse(seoResult.output);
      } else {
        metadata = ArticleMetadataSchema.parse(
          JSON.parse(extractOutputText(seoResult.output))
        );
      }

      // 7. Resolve Cover Image and Research Sources
      const coverImage = await coverImagePromise;

      const sources = extractSourcesFromMarkdown(
        `${researchDossier}\n\n${fullMarkdown}`
      );

      console.info(
        `[ADK Blog Workflow] Workflow completed successfully! Title: "${metadata.title}" | Word Count: ${metadata.wordCount} | Sources: ${sources.length} | Cover Image: ${coverImage ? "Generated" : "None"}`
      );

      return {
        metadata,
        fullMarkdown,
        sections: draftedSections,
        sources,
        coverImage,
      };
    },
  });
}

/**
 * Convenience runner function to execute the ADK blog generation workflow.
 */
export async function runBlogGeneration(
  config: BlogGenerationConfig
): Promise<BlogGenerationResult> {
  const workflow = createBlogGenerationWorkflow();
  const runner = new InMemoryRunner({
    agent: workflow,
    appName: "ADKBlogGenerationSystem",
  });

  let finalResult: BlogGenerationResult | undefined;

  for await (const event of runner.runEphemeral({
    userId: "system",
    newMessage: {
      parts: [{ text: JSON.stringify(config) }],
    },
  })) {
    if (event.output && typeof event.output === "object") {
      finalResult = event.output as BlogGenerationResult;
    }
  }

  if (!finalResult) {
    throw new Error(
      "[ADK Blog Workflow] Workflow execution completed without yielding final result output."
    );
  }

  return finalResult;
}
