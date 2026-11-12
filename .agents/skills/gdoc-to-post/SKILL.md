---
name: gdoc-to-post
description: >-
  Converts a Google Doc into a fully formatted, published Sanity blog post with
  interactive citations, KaTeX mathematical equations, and expandable source lists.
  Use when the user asks to create, import, or publish a blog post from a Google Doc
  (or shares a docs.google.com URL / Google Doc ID).
license: MIT
metadata:
  author: personal-blog
  version: "1.0.0"
---

# Google Doc to Sanity Blog Post Runbook

This skill defines the canonical publication standard and end-to-end procedure for converting Google Docs into published, high-aesthetic blog posts in this repository. All future posts created, imported, or updated MUST adhere strictly to the architecture, formatting rules, and non-negotiable mandates established below.

---

## Strict Mandates

The following rules are mandatory for every post created or updated using this skill. They must be followed without exception:

1. **Line Breaks Must Be Preserved**:
   - Google Docs paragraph boundaries must be preserved as distinct Portable Text blocks.
   - In Markdown, paragraphs MUST be separated by a blank line (`\n\n`). Never output a single `\n` between paragraphs, or CommonMark parsers will collapse consecutive paragraphs into a single run-on block.
   - Any block containing trapped newlines (`\n`) must be split into separate paragraph blocks so that each paragraph receives proper vertical spacing (`mb-4 leading-relaxed`) and editorial rhythm. Soft line breaks within paragraphs are rendered via `<br />`.

2. **Tables Must Be Displayed As Is**:
   - Tables from the Google Doc must be preserved and rendered **as is** as native Sanity `table` and `tableRow` objects.
   - **NEVER** convert tables into bullet lists, summaries, or text approximations unless explicitly instructed otherwise by the user.
   - Tables must retain all header rows, cell formatting, superscripts, subscripts, and inline formatting.

3. **Works Cited Must Be Displayed As Is Unless Explicitly Instructed Otherwise**:
   - The complete bibliography / Works Cited section must be preserved and displayed **as is** in the article content as a numbered list under `#### Works cited`.
   - **NEVER** truncate, summarize, omit, or collapse the Works Cited section in the article body unless explicitly instructed otherwise by the user.
   - In addition, all extracted sources must be stored uncapped in `post.sources` for the interactive `<ExpandableSources />` drawer.

4. **Diagrams and Flowcharts Must Be Represented Cleanly**:
   - **NEVER** leave raw ASCII box art (e.g. `┌────┐`, `│ ... │`, `└────┘`) or collapsed monospaced character blocks inside article paragraphs.
   - Flowcharts, process diagrams, and developmental frameworks present in Google Docs must be cleanly parsed and rendered using high-aesthetic Neo-Minimalist components (e.g. `<DevelopmentalFlowchart />`) or structured visual card pipelines featuring:
     - Clear sequential phases with numeric stage badges (`01`, `02`, `03`).
     - Distinct thematic accent colors and Lucide icons (e.g. `Filter`, `Eye`, `Brain`, `TrendingUp`, `ArrowDown`).
     - Responsive grid cards with high-contrast text and dark/light mode compatibility.

5. **Table Cell Entity Decoding & KaTeX Hygiene**:
   - Mathematical inequalities and symbols (`>`, `<`, `&`) in table cells must never leak raw HTML entities (`&gt;`, `&lt;`, `&amp;`) into KaTeX or the DOM.
   - KaTeX interprets `&` as a column alignment delimiter; passing `&gt; 1` triggers a syntax failure and causes the literal text `&gt; 1` to be displayed.
   - Always ensure entities are decoded before math parsing (handled in `renderCellHtml` in [`components/portable-text.tsx`](../../../components/portable-text.tsx)) and wrap math expressions cleanly in `$ > 1 $` or `$ < 0.05 $`.

6. **Current Publication Timestamp on Publish/Update**:
   - When publishing or patching a post, `date` must always be explicitly set to `new Date().toISOString()`, unless the user explicitly requests backdating.
   - This ensures newly published articles are sorted to the top of the homepage feed (`*[_type == "post"] | order(date desc)[0]`) and featured properly.

7. **Cover Image Preservation & Parity Across Datasets**:
   - **NEVER** overwrite, delete, or set `coverImage: null` when a cover image exists.
   - When synchronizing across `production` and `development`, propagate the existing cover image so that both environments share visual fidelity.

---

## Workflow Overview

```
Google Doc (via gdocs tool / API)
  │
  ├── 1. Ingest content & structure (headings, text runs, tables, Works Cited, diagrams)
  │       └─ Normalize soft breaks (\x0b -> \n)
  ├── 2. Map and assign 1-based citations (<sup>N</sup>) in body
  ├── 3. Format and sanitize math equations ($$...$$, \$ escaped, unescaped table inequalities)
  ├── 4. Convert Markdown to Portable Text (split blocks, preserve tables as-is)
  │       └─ Transform ASCII flowcharts/diagrams into clean Neo-Minimalist components
  └── 5. Synchronize to Sanity (production & development)
          ├─ Set date: new Date().toISOString()
          └─ Preserve & propagate coverImage across datasets
```

---

## Step 1: Ingest Google Doc Content

1. Use the `gdocs` skill / tool or Google Docs API with the document ID:
   - Extract plain text, paragraphs, headings, bullet lists, and tables.
2. **Table Preservation (Mandatory As-Is)**:
   - Extract tables from the Google Doc and format them as HTML/Markdown tables so they deserialize into native `table` and `tableRow` objects in Sanity.
   - **MANDATORY**: Display tables **as is**. Never replace or convert tables into bullet lists, summaries, or text blocks unless explicitly instructed otherwise by the user. Ensure cell superscripts, subscripts, and formatting are preserved.
3. **Works Cited Isolation**:
   - Locate the `"Works cited"` or `"References"` section at the end of the document.
   - Separate the main body from the bibliography for independent processing.
4. **Paragraph Spacing & Line Break Preservation**:
   - Google Docs models each paragraph as a distinct element (`NORMAL_TEXT`).
   - In Markdown, paragraphs MUST be separated by a blank line (`\n\n`). Never output a single `\n` between paragraphs, or CommonMark parsers will collapse consecutive paragraphs into a single run-on block.
   - Line breaks within blocks: `marked.parse` runs with `{ breaks: true, gfm: true }` and `CustomPortableText` renders `<br />` elements for line breaks within text spans.
5. **Soft-Break Normalization**:
   - Google Docs often stores intra-paragraph line breaks or shift-returns as vertical tabs (`\x0b`).
   - Always replace `\x0b` with standard newlines (`\n`) before Markdown conversion to avoid collapsing lines, concatenating adjacent words, or distorting diagram boxes.

---

## Step 2: Citation Extraction & In-Text Superscripts

1. **Extract and Clean Sources**:
   - For every entry in the bibliography:
     - Extract URL (`https://...`).
     - Extract title (text preceding URL or access timestamp).
     - Strip access dates (e.g., `, accessed May 16, 2026,` or `accessed [Date]`).
     - Remove leading list markers (`1. `, `- `, `* `).
     - If title is missing or generic (`"link"`), fall back to the URL's hostname or path.
2. **Assign 1-Based Citation Index**:
   - Structure each source as `{ _key: "source-${num}", _type: "source", name: "${num}. ${title}", uri: url }`.
   - Prefixing `${num}. ` enables readers to cross-reference superscript numbers in the text directly with cards in the Sources section.
3. **In-Text Superscripts**:
   - Format in-text references as HTML superscripts: `<sup>1</sup>`, `<sup>15, 16</sup>`.
   - The repository's Sanity schema ([`sanity/schemas/documents/post.ts`](../../../sanity/schemas/documents/post.ts)) defines the `sup` decorator mark, and [`convex/_lib/adk/sanity_publisher.ts`](../../../convex/_lib/adk/sanity_publisher.ts) deserializes `<sup>` tags into Portable Text mark `sup`.
   - Ensure every factual claim or cited assertion receives its exact corresponding superscript marker.
4. **Preserve Works Cited in Article Content (Mandatory As-Is Unless Explicitly Instructed Otherwise)**:
   - Always preserve and display the complete bibliography at the bottom of the article body under `#### Works cited`.
   - **MANDATORY**: Display Works Cited as is. Never omit, truncate, summarize, or collapse the bibliography in the article content unless the user explicitly instructs otherwise.
   - Format each entry as a 1-based numbered Markdown link (`1. [Title](url)`).
   - When parsed by `markdownToPortableText`, this produces ordered list blocks (`listItem: "number"`) with clickable link marks matching the in-text `<sup>` citation numbers, ensuring the bibliography is rendered in the post content as well as the interactive `<ExpandableSources />` component.

---

## Step 3: Math & Equation Formatting for KaTeX

1. **Display Equations**:
   - Enclose standalone formulas in `$$...$$` blocks.
   - **MANDATORY**: Leave a blank line before and after `$$`. Never leave trailing spaces (`  \n`) on the line preceding `$$` (which causes Markdown parsers to treat `$$` as an inline line break inside the prior paragraph).
2. **Escaping Currency Symbols**:
   - **CRITICAL**: In LaTeX math mode, literal dollar signs MUST be escaped as `\$` (e.g., `\frac{\$100}{\frac{1}{100{,}000}} = \$10{,}000{,}000`).
   - Raw `$` inside math mode causes a KaTeX parse error (`Can't use function '$' in math mode`), which renders the equation in **red error text**.
   - Note: [`components/portable-text.tsx`](../../../components/portable-text.tsx) includes defensive auto-escaping `cleanMath.replace(/(?<!\\)\$/g, "\\$")`, but Markdown sources should always follow standard LaTeX escaping.
3. **Inline Math**:
   - Wrap inline variables or short formulas in `$ ... $` (e.g., `$c < br$`, `$I_t$`, `($2\text{ years} \times 0.5$)`).
4. **Table Cell Math & Inequality Entity Decoding**:
   - When table cells contain mathematical inequalities (`> 1`, `< 0.05`), do not let Markdown parsers convert them to `&gt;` or `&lt;` before KaTeX evaluation.
   - Wrap them in clean inline math with spaces (e.g. `$ > 1 $`, `$ < 0.05 $`).
   - If HTML entities are present, ensure they are unescaped before math evaluation so KaTeX does not encounter `&` and fail.

See [Math & KaTeX Guidelines](./references/math-and-katex.md) for detailed equation patterns.

---

## Step 4: Convert Markdown to Portable Text

Use `markdownToPortableText` from [`convex/_lib/adk/sanity_publisher.ts`](../../../convex/_lib/adk/sanity_publisher.ts):

```typescript
import { markdownToPortableText } from "@/convex/_lib/adk/sanity_publisher";

const rawBlocks = markdownToPortableText(markdownContent);
// Ensure line break integrity: split any blocks with trapped newlines into separate paragraph blocks
const blocks = splitBlocksByNewlines(rawBlocks);
```

- Converts markdown into valid Sanity Portable Text blocks.
- Preserves `sup` and `sub` decorator marks.
- Preserves tables as native Sanity `table` and `tableRow` objects.
- Preserves standalone `$$...$$` equation blocks for rendering via `DisplayMathCard`.
- Enforces strict line break preservation by splitting any multi-paragraph blocks.

---

## Step 4b: Diagrams & Flowcharts (Clean Representation Standard)

Google Docs frequently represent sequential processes, cognitive frameworks, or ontogenies using ASCII box characters (e.g. `┌───┐`, `│`, `└───┘`) or multi-line text boxes with vertical tabs (`\x0b`).

1. **NEVER Render Raw ASCII Art**:
   - Monospaced ASCII art collapses inside standard `<p>` elements into illegible, wrap-broken blocks.
2. **Transform Into Neo-Minimalist Components**:
   - Deconstruct the stages, inputs, mechanisms, and phenotypic milestones.
   - Implement an aesthetic React component in [`components/portable-text.tsx`](../../../components/portable-text.tsx) (or map the block via a recognized pattern/trigger) that renders:
     - Stage numbering pills (e.g. `01`, `02`, `03`).
     - Distinct color accents per stage (e.g. Blue, Indigo, Amber, Emerald).
     - Lucide icons identifying stage semantics (e.g. `<Filter />`, `<Eye />`, `<Brain />`, `<TrendingUp />`, `<ArrowDown />`).
     - Downward directional step connectors.
     - Responsive grid cards with dark/light mode background blending (`bg-background/80`, `border-border/50`).
3. **Example Component Structure**:
   See `DevelopmentalFlowchart()` in [`components/portable-text.tsx`](../../../components/portable-text.tsx) for the canonical 4-stage pipeline implementation.

---

## Step 5: Sanity Dataset Synchronization & Asset Protection

Always update **both** datasets (`production` and `development`) to prevent environment divergence. Use the canonical logic in [`.agents/skills/gdoc-to-post/scripts/publish_gdoc_post.ts`](./scripts/publish_gdoc_post.ts):

```typescript
import { getSanityClient } from "@/convex/_lib/adk/sanity_publisher";

let sharedCoverImage: unknown = undefined;

for (const dataset of ["production", "development"]) {
  process.env.NEXT_PUBLIC_SANITY_DATASET = dataset;
  const client = getSanityClient();

  // 1. Fetch existing document
  const existing = await client.getDocument(postId);

  // 2. CRITICAL: Preserve & propagate cover image across datasets
  if (existing?.coverImage) {
    sharedCoverImage = existing.coverImage;
  }

  const docPayload = {
    _type: "post",
    _id: postId,
    title: doc.title,
    slug: { _type: "slug", current: slug },
    content: blocks,
    sources: allSources, // Do NOT slice or cap at 15
    hide: false,
    date: new Date().toISOString(), // Mandatory: current date ensures proper homepage sorting
    ...(sharedCoverImage ? { coverImage: sharedCoverImage } : {}),
  };

  // 3. Patch or create document
  await client.createOrReplace(docPayload);

  // 4. Synchronize Studio draft if present
  const draftId = `drafts.${postId}`;
  const draftDoc = await client.getDocument(draftId);
  if (draftDoc) {
    await client
      .patch(draftId)
      .set({
        content: blocks,
        sources: allSources,
        date: docPayload.date,
        ...(sharedCoverImage ? { coverImage: sharedCoverImage } : {}),
      })
      .commit();
  }
}
```

### Critical Rules
- **Current Publication Date**: Always set `date: new Date().toISOString()` unless explicitly instructed to retain historical dates.
- **Cover Image Propagation**: Never set `coverImage: null` or overwrite an existing cover image. If a cover image exists in one dataset, propagate it to other datasets to maintain visual parity.
- **Token**: Always use `SANITY_API_DEVELOPER_TOKEN` via `getSanityClient()`. `SANITY_API_WRITE_TOKEN` may lack write permissions on the `production` dataset.
- **Uncapped Sources**: Store all $N$ parsed sources in `post.sources`. The frontend [`ExpandableSources`](../../../components/expandable-sources.tsx) component handles UI folding and search filtering automatically.

---

## Step 6: Verification & Git Hygiene

1. **Verify Static Types & Linting**:
   - `yarn tsc --noEmit` (must exit with 0 errors).
   - `yarn test:once` (all tests must pass).
   - `yarn lint` (0 errors, 0 warnings).
2. **Verify Visual Rendering**:
   - Check formula cards in light and dark mode (confirm no red error text).
   - Confirm table cells render math inequalities cleanly (no visible `&gt; 1` or `&lt; 0.05`).
   - Confirm flowcharts render as rich Neo-Minimalist components with stage badges and icons, never collapsed ASCII boxes.
   - Confirm superscripts render small and raised (`text-[0.7em] leading-none align-super text-blue-600`).
   - Confirm Sources & Grounding displays count pill, initial 10 cards, search filter, and expand/collapse toggle.
3. **Verify Deployment & Live Production**:
   - Stage and commit changes with a clean, repository-level commit message (e.g. `fix(blog): ...`).
   - Push to `origin main` to trigger Vercel deployment.
   - **Vercel Preview URL Note**: `*.vercel.app` preview deployments are protected by Vercel SSO (HTTP 302 redirect). Always verify against the live production custom domain: `https://blog.agnivon.dev`.
   - **Next.js ISR Edge Cache Revalidation**: On initial curl/visit to `https://blog.agnivon.dev/posts/...`, the edge cache may return `x-vercel-cache: STALE` while triggering background revalidation. Subsequent requests will return `x-vercel-cache: HIT` with updated content.
   - Confirm the homepage (`https://blog.agnivon.dev`) displays the post at the top as the Featured Post.
4. **Scratch Files & Commit Standards**:
   - Any temporary extraction, parsing, or inspection scripts MUST live in `<appDataDir>/brain/<conversation-id>/scratch/`. Never commit one-off scratch scripts to `scripts/` or the repo root.
   - Commit messages must be repository-level (e.g. `feat(blog): ...`, `fix(portable-text): ...`), never mentioning specific article titles, citation counts, or one-off post metrics.
