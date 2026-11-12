/**
 * publish_gdoc_post.ts
 *
 * Reusable automation script for converting and publishing Google Doc content
 * into a Sanity blog post with interactive citations, KaTeX display math,
 * and dual-dataset synchronization.
 *
 * STRICT MANDATES:
 * 1. Line breaks must be preserved: Google Doc paragraphs must remain separate blocks.
 *    Any blocks containing trapped newlines are automatically split by splitBlocksByNewlines().
 * 2. Tables must be displayed as is: Native Sanity table/tableRow objects are preserved
 *    without being converted into bullet lists or summaries.
 * 3. Works cited must be displayed as is unless explicitly instructed otherwise:
 *    The complete numbered bibliography is rendered under "#### Works cited" in article content
 *    and synchronized to post.sources.
 *
 * Usage:
 *   npx jiti .agents/skills/gdoc-to-post/scripts/publish_gdoc_post.ts --input path/to/article.md [options]
 *
 * Options:
 *   --input <path>               Required: Path to input markdown file.
 *   --title <title>              Optional: Explicit title (inferred from first '# ' if omitted).
 *   --slug <slug>                Optional: Explicit slug (derived from title if omitted).
 *   --excerpt <excerpt>          Optional: Post summary/excerpt (inferred from first paragraph if omitted).
 *   --post-id <id>               Optional: Sanity document ID to update directly.
 *   --datasets <list>            Optional: Comma-separated list of datasets (default: "production,development").
 *   --author-id <id>             Optional: Sanity author _id reference.
 *   --preserve-cover-image       Optional: Preserve existing coverImage (default: true).
 *   --dry-run                    Optional: Parse and validate without committing to Sanity.
 */

import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { createClient, type SanityClient } from "@sanity/client";
import { markdownToPortableText } from "../../../../convex/_lib/adk/sanity_publisher";

// Load .env.local if running outside Next.js runtime
const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  try {
    const envContent = readFileSync(envLocalPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } catch (err) {
    console.warn("[publish_gdoc_post] Warning reading .env.local:", err);
  }
}

export interface PublishScriptOptions {
  inputPath: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  postId?: string;
  datasets: string[];
  authorId?: string;
  preserveCoverImage: boolean;
  dryRun: boolean;
}

export interface SanitySourceItem {
  _key: string;
  _type: "source";
  name: string;
  uri: string;
}

export interface ParsedDocument {
  title: string;
  slug: string;
  excerpt: string;
  bodyMarkdown: string;
  sources: SanitySourceItem[];
  equationCount: number;
}

/**
 * Parses CLI arguments into structured options.
 */
export function parseArgs(argv: string[]): PublishScriptOptions {
  const options: PublishScriptOptions = {
    inputPath: "",
    datasets: ["production", "development"],
    preserveCoverImage: true,
    dryRun: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--input" && argv[i + 1]) {
      options.inputPath = argv[++i];
    } else if (arg === "--title" && argv[i + 1]) {
      options.title = argv[++i];
    } else if (arg === "--slug" && argv[i + 1]) {
      options.slug = argv[++i];
    } else if (arg === "--excerpt" && argv[i + 1]) {
      options.excerpt = argv[++i];
    } else if (arg === "--post-id" && argv[i + 1]) {
      options.postId = argv[++i];
    } else if (arg === "--datasets" && argv[i + 1]) {
      options.datasets = argv[++i].split(",").map((d) => d.trim()).filter(Boolean);
    } else if (arg === "--author-id" && argv[i + 1]) {
      options.authorId = argv[++i];
    } else if (arg === "--preserve-cover-image") {
      options.preserveCoverImage = true;
    } else if (arg === "--no-preserve-cover-image") {
      options.preserveCoverImage = false;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    }
  }

  return options;
}

/**
 * Normalizes a title into a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Extracts and cleans bibliography sources from Works Cited / References.
 */
export function extractWorksCited(rawMarkdown: string): {
  cleanedBody: string;
  sources: SanitySourceItem[];
  worksCitedMarkdown: string;
} {
  const worksCitedPattern =
    /(?:^|\n)(?:#{1,4}\s*(?:Works cited|Works Cited|References|Bibliography)[\s\S]*)$/i;
  const match = worksCitedPattern.exec(rawMarkdown);

  let body = rawMarkdown;
  let citationsBlock = "";
  let headingPrefix = "####";
  let headingTitle = "Works cited";

  if (match) {
    body = rawMarkdown.slice(0, match.index).trim();
    citationsBlock = match[0];

    const headingMatch = /^(#{1,4})\s*([^\n]+)/.exec(citationsBlock.trim());
    if (headingMatch) {
      headingPrefix = headingMatch[1];
      headingTitle = headingMatch[2].trim();
    }
  }

  const rawSources: { title: string; uri: string }[] = [];
  const seenUrls = new Set<string>();

  const lines = citationsBlock.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // 1. Markdown link [Title](https://...) or Title, [URL](URL)
    const mdLinkMatch = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/.exec(line);
    if (mdLinkMatch) {
      const uri = mdLinkMatch[2].replace(/[.,;)]+$/, "");
      if (!seenUrls.has(uri)) {
        seenUrls.add(uri);

        const beforeLink = line.slice(0, mdLinkMatch.index).trim();
        let cleanTitle = beforeLink
          .replace(/^>*\s*(?:[-*•]|\d+[.)\]])\s*/, "") // Strip leading numbers with delimiter, bullets, blockquotes
          .replace(/,?\s*accessed\s+[A-Za-z0-9,\s]+$/i, "") // Strip access date
          .replace(/\baccessed\s+[A-Za-z0-9,\s]+$/i, "")
          .replace(/[:\-–—.,\s]+$/, "")
          .trim();

        if (!cleanTitle) {
          const linkText = mdLinkMatch[1].trim();
          if (!linkText.startsWith("http://") && !linkText.startsWith("https://")) {
            cleanTitle = linkText;
          }
        }

        if (!cleanTitle || cleanTitle.toLowerCase() === "link") {
          try {
            const u = new URL(uri);
            cleanTitle = u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "");
          } catch {
            cleanTitle = uri;
          }
        }

        rawSources.push({ title: cleanTitle, uri });
      }
      continue;
    }

    // 2. Any URL on the line (e.g. Title, accessed May 16, 2026, https://...)
    const urlMatch = /(https?:\/\/[^\s\)]+)/.exec(line);
    if (urlMatch) {
      const uri = urlMatch[1].replace(/[.,;)]+$/, "");
      if (seenUrls.has(uri)) continue;
      seenUrls.add(uri);

      const beforeUrl = line.slice(0, urlMatch.index).trim();
      let cleanTitle = beforeUrl
        .replace(/^>*\s*(?:[-*•]|\d+[.)\]])\s*/, "") // Strip leading numbers with delimiter, bullets, blockquotes
        .replace(/,?\s*accessed\s+[A-Za-z0-9,\s]+$/i, "") // Strip access date
        .replace(/\baccessed\s+[A-Za-z0-9,\s]+$/i, "")
        .replace(/[:\-–—.,\s]+$/, "")
        .trim();

      if (!cleanTitle || cleanTitle.toLowerCase() === "link") {
        try {
          const u = new URL(uri);
          cleanTitle = u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "");
        } catch {
          cleanTitle = uri;
        }
      }

      rawSources.push({ title: cleanTitle, uri });
    }
  }

  // Assign 1-based indexing
  const sources: SanitySourceItem[] = rawSources.map((s, index) => {
    const num = index + 1;
    return {
      _key: `source-${num}`,
      _type: "source",
      name: `${num}. ${s.title}`,
      uri: s.uri,
    };
  });

  // Format clean numbered markdown bibliography to preserve Works Cited in the article content
  let worksCitedMarkdown = "";
  if (rawSources.length > 0) {
    const listItems = rawSources
      .map((s, idx) => `${idx + 1}. [${s.title}](${s.uri})`)
      .join("\n");
    worksCitedMarkdown = `${headingPrefix} ${headingTitle}\n\n${listItems}`;
  }

  return { cleanedBody: body, sources, worksCitedMarkdown };
}

/**
 * Sanitizes KaTeX display and inline math:
 * 1. Ensures clean blank lines before and after $$ blocks.
 * 2. Removes trailing spaces on the line preceding $$ to prevent soft-break paragraph merging.
 * 3. Escapes literal currency dollar signs inside math mode (\$100, \$10{,}000{,}000).
 * 4. Wraps numbers with commas in {,} for correct typographic kerning.
 */
export function sanitizeKaTeXMath(markdown: string): {
  sanitized: string;
  equationCount: number;
} {
  let count = 0;

  // Process display math blocks: $$ ... $$
  const displayMathRegex = /(?:^|\n)[ \t]*\$\$([\s\S]*?)\$\$[ \t]*(?=\n|$)/g;

  let sanitized = markdown.replace(displayMathRegex, (_match, mathInner: string) => {
    count++;
    let clean = mathInner.trim();

    // Escape raw currency dollar signs in math mode
    clean = clean.replace(/(?<!\\)\$/g, "\\$");

    // Format numbers with thousands separators: 100,000 -> 100{,}000
    clean = clean.replace(/(\d+),(\d{3})/g, "$1{,}$2");

    return `\n\n$$\n${clean}\n$$\n\n`;
  });

  // Ensure any paragraph ending right before $$ does not have trailing soft-break spaces
  sanitized = sanitized.replace(/[ \t]+\n\n\$\$/g, "\n\n$$");

  return { sanitized, equationCount: count };
}

/**
 * Normalizes citation brackets [1], [49], [15, 16] to <sup> tags in text.
 */
export function normalizeSuperscriptCitations(markdown: string): string {
  // Convert [49] or [15, 16] into <sup>49</sup> when referencing citations
  return markdown.replace(/\[(\d+(?:\s*,\s*\d+)*)\](?!\()/g, "<sup>$1</sup>");
}

/**
 * Parses and validates the complete document from file path.
 */
export function parseDocument(
  inputPath: string,
  overrides?: Partial<PublishScriptOptions>
): ParsedDocument {
  if (!existsSync(inputPath)) {
    throw new Error(`Input file not found at: ${inputPath}`);
  }

  const rawContent = readFileSync(inputPath, "utf-8");

  // 1. Separate bibliography & assign 1-based indexed sources
  const { cleanedBody, sources, worksCitedMarkdown } = extractWorksCited(rawContent);

  // 2. Sanitize math blocks
  const { sanitized: mathCleanedBody, equationCount } = sanitizeKaTeXMath(cleanedBody);

  // 3. Format superscript citations
  const normalizedBody = normalizeSuperscriptCitations(mathCleanedBody);

  // 4. Combine body with preserved, formatted Works Cited section
  const bodyMarkdown = worksCitedMarkdown
    ? `${normalizedBody.trim()}\n\n${worksCitedMarkdown}`
    : normalizedBody;

  // 4. Infer title
  let title = overrides?.title;
  if (!title) {
    const titleMatch = /^#\s+(.+)$/m.exec(bodyMarkdown);
    title = titleMatch ? titleMatch[1].trim() : "Untitled Document";
  }

  // 5. Infer slug
  const slug = overrides?.slug || slugify(title);

  // 6. Infer excerpt
  let excerpt = overrides?.excerpt;
  if (!excerpt) {
    const paragraphs = bodyMarkdown
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p && !p.startsWith("#") && !p.startsWith("$$") && !p.startsWith(">"));
    excerpt = paragraphs[0] ? paragraphs[0].slice(0, 200).replace(/\s+[^\s]*$/, "...") : "";
  }

  return {
    title,
    slug,
    excerpt,
    bodyMarkdown,
    sources,
    equationCount,
  };
}

/**
 * Creates an authorized Sanity client for a specific dataset.
 */
export function getDatasetClient(dataset: string): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const token = process.env.SANITY_API_DEVELOPER_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-02-28";

  if (!projectId || !token) {
    throw new Error(
      `[publish_gdoc_post] Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_DEVELOPER_TOKEN.`
    );
  }

  return createClient({
    projectId,
    dataset,
    token,
    apiVersion,
    useCdn: false,
  });
}

interface SanitySpan {
  _key: string;
  _type: string;
  text?: string;
  marks?: string[];
  [key: string]: unknown;
}

interface SanityBlock {
  _key: string;
  _type: string;
  children?: SanitySpan[];
  style?: string;
  listItem?: string;
  level?: number;
  markDefs?: unknown[];
  [key: string]: unknown;
}

/**
 * Enforces strict line break preservation: splits any Portable Text block
 * containing trapped newlines into distinct paragraph blocks so that each paragraph
 * receives proper vertical spacing and editorial rhythm.
 */
export function splitBlocksByNewlines(blocks: unknown[]): unknown[] {
  const result: unknown[] = [];

  for (const rawBlock of blocks) {
    if (!rawBlock || typeof rawBlock !== "object") {
      result.push(rawBlock);
      continue;
    }

    const block = rawBlock as SanityBlock;

    if (block._type !== "block" || !Array.isArray(block.children)) {
      result.push(block);
      continue;
    }

    // Filter out completely empty blocks
    const blockText = block.children.map((c) => c.text || "").join("").trim();
    if (blockText.length === 0) {
      continue;
    }

    const hasNewline = block.children.some(
      (c) => typeof c.text === "string" && c.text.includes("\n")
    );
    if (!hasNewline) {
      result.push(block);
      continue;
    }

    // Preserve display math blocks intact
    if (
      (blockText.startsWith("$$") && blockText.endsWith("$$")) ||
      (blockText.startsWith("\\[") && blockText.endsWith("\\]")) ||
      /^(?:\\text\{|HLV\s*=|Total Award\s*=|Hedonic Value\s*=|DALY\s*=)/.test(blockText)
    ) {
      result.push(block);
      continue;
    }

    let currentChildren: SanitySpan[] = [];

    const finishParagraph = () => {
      const validChildren = currentChildren.filter((c) => (c.text || "").length > 0);
      const totalText = validChildren.map((c) => c.text || "").join("").trim();

      if (totalText.length > 0) {
        if (
          validChildren.length > 0 &&
          typeof validChildren[0].text === "string" &&
          !validChildren[0].marks?.includes("sup")
        ) {
          validChildren[0] = {
            ...validChildren[0],
            text: validChildren[0].text.replace(/^\s+/, ""),
          };
        }
        result.push({
          ...block,
          _key: randomBytes(6).toString("hex"),
          children: validChildren,
        });
      }
      currentChildren = [];
    };

    for (const child of block.children) {
      const text = child.text;
      if (typeof text !== "string" || !text.includes("\n")) {
        currentChildren.push(child);
        continue;
      }

      const parts = text.split("\n");
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i > 0) {
          finishParagraph();
        }
        if (part.length > 0) {
          currentChildren.push({
            ...child,
            _key: randomBytes(6).toString("hex"),
            text: part,
          });
        }
      }
    }

    finishParagraph();
  }

  return result;
}

/**
 * Synchronizes the parsed blog post across target datasets.
 */
export async function syncPostToSanity(
  doc: ParsedDocument,
  options: PublishScriptOptions
): Promise<{ updatedDatasets: string[]; postIds: Record<string, string> }> {
  const postIds: Record<string, string> = {};
  const updatedDatasets: string[] = [];
  let sharedCoverImage: unknown = undefined;

  const rawBlocks = markdownToPortableText(doc.bodyMarkdown);
  const portableTextBlocks = splitBlocksByNewlines(rawBlocks);

  for (const dataset of options.datasets) {
    console.info(`\n[Sanity Sync] Connecting to dataset: '${dataset}'...`);
    const client = getDatasetClient(dataset);

    // 1. Resolve document ID (explicit, or lookup by slug)
    let existingDoc: Record<string, unknown> | null = null;
    let targetId = options.postId;

    if (targetId) {
      existingDoc = await client.getDocument(targetId);
    } else {
      const query = `*[_type == "post" && (slug.current == $slug || slug.current == $encodedSlug)][0]`;
      existingDoc = await client.fetch(query, {
        slug: doc.slug,
        encodedSlug: encodeURIComponent(doc.slug),
      });
      if (existingDoc && typeof existingDoc._id === "string") {
        targetId = existingDoc._id;
      }
    }

    const docPayload: Record<string, unknown> = {
      _type: "post",
      title: doc.title,
      slug: { _type: "slug", current: doc.slug },
      excerpt: doc.excerpt,
      content: portableTextBlocks,
      sources: doc.sources,
      hide: false,
      date: new Date().toISOString(),
    };

    // Resolve author reference safely
    let authorRefId = options.authorId || process.env.SANITY_BLOG_AUTHOR_ID;
    if (authorRefId) {
      const authorDoc = await client.getDocument(authorRefId);
      if (!authorDoc) {
        console.warn(
          `[Sanity Sync] Configured author ID '${authorRefId}' not found on '${dataset}'. Resolving primary author...`
        );
        const primaryAuthor = await client.fetch<string | null>(`*[_type == "author"][0]._id`);
        authorRefId = primaryAuthor || undefined;
      }
    } else {
      const primaryAuthor = await client.fetch<string | null>(`*[_type == "author"][0]._id`);
      authorRefId = primaryAuthor || undefined;
    }

    if (authorRefId) {
      docPayload.author = {
        _type: "reference",
        _ref: authorRefId,
      };
    }

    // Preserve existing coverImage
    if (options.preserveCoverImage) {
      if (existingDoc?.coverImage) {
        sharedCoverImage = existingDoc.coverImage;
        docPayload.coverImage = existingDoc.coverImage;
        console.info(`[Sanity Sync] Preserved existing coverImage on '${dataset}'.`);
      } else if (sharedCoverImage) {
        docPayload.coverImage = sharedCoverImage;
        console.info(`[Sanity Sync] Propagated coverImage from earlier dataset to '${dataset}'.`);
      }
    }

    if (options.dryRun) {
      console.info(`[DRY RUN] Would commit post to '${dataset}' (targetId: ${targetId || "new"})`);
      continue;
    }

    let finalId = targetId;

    if (targetId && existingDoc) {
      // Patch existing published document
      await client.patch(targetId).set(docPayload).commit();
      console.info(`[Sanity Sync] Successfully patched document '${targetId}' on '${dataset}'.`);

      // Check and synchronize draft document in Sanity Studio if present
      const draftId = `drafts.${targetId}`;
      const existingDraft = await client.getDocument(draftId);
      if (existingDraft) {
        await client.patch(draftId).set(docPayload).commit();
        console.info(`[Sanity Sync] Synchronized Studio draft '${draftId}' on '${dataset}'.`);
      }
    } else {
      // Create new document
      docPayload.date = new Date().toISOString();
      if (targetId) {
        docPayload._id = targetId;
        const created = await client.createIfNotExists(docPayload);
        finalId = created._id;
        console.info(`[Sanity Sync] Created document with ID '${finalId}' on '${dataset}'.`);
      } else {
        const created = await client.create(docPayload);
        finalId = created._id;
        targetId = finalId; // Propagate ID to subsequent datasets
        console.info(`[Sanity Sync] Created new document '${finalId}' on '${dataset}'.`);
      }
    }

    if (finalId) {
      postIds[dataset] = finalId;
      updatedDatasets.push(dataset);
    }
  }

  return { updatedDatasets, postIds };
}

/**
 * Main execution routine.
 */
export async function main() {
  const options = parseArgs(process.argv);

  if (!options.inputPath) {
    console.error(`
Error: Missing required --input argument.

Usage:
  npx jiti .agents/skills/gdoc-to-post/scripts/publish_gdoc_post.ts --input path/to/article.md [options]

Run with --help or inspect SKILL.md for complete documentation.
`);
    process.exit(1);
  }

  console.info(`[publish_gdoc_post] Loading input file: ${options.inputPath}`);
  const parsed = parseDocument(options.inputPath, options);

  console.info(`\n=== Document Parse Summary ===`);
  console.info(`Title:        ${parsed.title}`);
  console.info(`Slug:         ${parsed.slug}`);
  console.info(`Sources:      ${parsed.sources.length} indexed items`);
  console.info(`Equations:    ${parsed.equationCount} display blocks sanitized`);
  console.info(`Excerpt:      ${parsed.excerpt.slice(0, 100)}...`);

  if (options.dryRun) {
    console.info(`\n[DRY RUN] Simulation complete. No mutations written to Sanity.`);
    return;
  }

  const { updatedDatasets, postIds } = await syncPostToSanity(parsed, options);

  console.info(`\n=== Publication Succeeded ===`);
  for (const ds of updatedDatasets) {
    console.info(`- Dataset '${ds}': Document ID = ${postIds[ds]}`);
  }
}

// Execute when invoked directly
if (process.argv[1]?.includes("publish_gdoc_post.ts")) {
  main().catch((err) => {
    console.error("[publish_gdoc_post] Fatal error:", err);
    process.exit(1);
  });
}
