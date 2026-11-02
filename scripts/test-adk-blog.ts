import fs from "fs";
import path from "path";
import * as adk from "../convex/_lib/adk";

// Simple env loader for .env.local if not already populated
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

async function main() {
  const args = process.argv.slice(2);
  let topic = "Autonomous AI Agent Workflows and Graph-Based Architectures";
  let instructions = "Include real-world examples, architecture trade-offs, and clear technical mechanisms.";
  let lengthPreset: adk.LengthPreset = "brief";
  let targetWordCount: number | undefined;
  let model: string = adk.GEMINI_MODELS.LATEST_FLASH;
  let dryRun = true;
  let outputFile = "test_adk_article.md";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--topic" && args[i + 1]) {
      topic = args[++i];
    } else if (arg === "--instructions" && args[i + 1]) {
      instructions = args[++i];
    } else if (arg === "--length" && args[i + 1]) {
      lengthPreset = args[++i] as adk.LengthPreset;
    } else if (arg === "--words" && args[i + 1]) {
      targetWordCount = parseInt(args[++i], 10);
      lengthPreset = "custom";
    } else if (arg === "--model" && args[i + 1]) {
      model = args[++i];
    } else if (arg === "--publish") {
      dryRun = false;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--output" && args[i + 1]) {
      outputFile = args[++i];
    }
  }

  console.log("=================================================");
  console.log("   Google ADK 2.0 Blog Generation Pipeline Test  ");
  console.log("=================================================");
  console.log(`Topic: "${topic}"`);
  console.log(`Model: ${model}`);
  console.log(`Length Preset: ${lengthPreset}`);
  if (targetWordCount) console.log(`Target Words: ${targetWordCount}`);
  console.log(`Dry Run (Skip Sanity): ${dryRun}`);
  console.log(`Output File: ${outputFile}`);
  console.log("=================================================\n");

  const startTime = Date.now();

  try {
    const result = await adk.runBlogGeneration({
      topic,
      instructions,
      lengthPreset,
      targetWordCount,
      model,
      includeCoverImage: true,
    });

    const elapsedSecs = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("\n=================================================");
    console.log("            GENERATION COMPLETED                ");
    console.log("=================================================");
    console.log(`Title: ${result.metadata.title}`);
    console.log(`Slug: ${result.metadata.slug}`);
    console.log(`Excerpt: ${result.metadata.excerpt}`);
    console.log(`Meta Description: ${result.metadata.metaDescription}`);
    console.log(`Keywords: ${result.metadata.keywords.join(", ")}`);
    console.log(`Tags: ${result.metadata.tags.join(", ")}`);
    console.log(`Actual Word Count: ${result.fullMarkdown.split(/\s+/).length} words`);
    console.log(`Estimated Reading Time: ${result.metadata.estimatedReadingMinutes} minutes`);
    console.log(`Sections Generated: ${result.sections.length}`);
    console.log(`Cover Image: ${result.coverImage ? `${result.coverImage.mimeType} (${result.coverImage.data.length} b64 bytes)` : "None"}`);
    console.log(`Elapsed Time: ${elapsedSecs}s`);

    // Write full markdown output
    fs.writeFileSync(outputFile, result.fullMarkdown, "utf-8");
    console.log(`Full markdown written to: ${path.resolve(process.cwd(), outputFile)}`);

    if (!dryRun) {
      console.log("\nPublishing to Sanity CMS...");
      const published = await adk.publishResultToSanity(result);
      console.log(`Published Post ID: ${published.postId}`);
      console.log(`URL Slug: /posts/${published.slug}`);
    } else {
      console.log("\n[Dry Run] Skipping Sanity CMS publish step. Pass --publish to publish.");
    }
  } catch (err) {
    console.error("\n[Error during ADK Blog Generation]:", err);
    process.exit(1);
  }
}

main();
