# Sanity Citations, Sources & Synchronization Guide

This guide details the schema requirements, citation numbering standards, Portable Text mark configuration, and dual-dataset synchronization rules for blog posts in this repository.

---

## Strict Mandates

When generating, converting, or synchronizing blog posts, the following three mandates are strictly enforced:

1. **Line Breaks Must Be Preserved**:
   - Google Docs paragraph boundaries must be preserved as distinct Portable Text blocks.
   - Any multi-paragraph block containing trapped newlines (`\n`) must be split into separate blocks. Soft line breaks within blocks are rendered as `<br />`.

2. **Tables Must Be Displayed As Is**:
   - Tables from the Google Doc must be preserved as native Sanity `table` and `tableRow` objects.
   - Never replace or simplify tables into bullet lists unless explicitly instructed otherwise by the user.

3. **Works Cited Must Be Displayed As Is Unless Explicitly Instructed Otherwise**:
   - The bibliography / Works Cited section must be preserved and rendered **as is** in the article body under `#### Works cited`.
   - Never omit, truncate, or summarize Works Cited in the article content unless explicitly instructed otherwise.
   - All extracted sources must also be stored uncapped in `post.sources` for the `<ExpandableSources />` drawer.

---

## 1. Sanity Schema Specification

The post schema is defined in [`sanity/schemas/documents/post.ts`](../../../../sanity/schemas/documents/post.ts).

### Content Decorators (`sup` and `sub`)
The `content` field supports custom superscript and subscript decorator marks in addition to standard formatting:

```typescript
defineArrayMember({
  type: "block",
  marks: {
    decorators: [
      { title: "Strong", value: "strong" },
      { title: "Emphasis", value: "em" },
      { title: "Code", value: "code" },
      { title: "Underline", value: "underline" },
      { title: "Strike", value: "strike-through" },
      {
        title: "Superscript",
        value: "sup",
        icon: SuperscriptIcon,
        component: SuperscriptDecorator,
      },
      {
        title: "Subscript",
        value: "sub",
        icon: SubscriptIcon,
        component: SubscriptDecorator,
      },
    ],
  },
})
```

### Sources Array Schema
The `sources` field stores structured reference cards:

```typescript
defineField({
  name: "sources",
  title: "Sources",
  type: "array",
  of: [
    {
      type: "object",
      name: "source",
      title: "Source",
      fields: [
        {
          name: "name",
          title: "Name",
          type: "string",
          validation: (rule) => rule.required(),
        },
        {
          name: "uri",
          title: "URI",
          type: "url",
          validation: (rule) => rule.required(),
        },
      ],
    },
  ],
})
```

---

## 2. Citation Numbering & In-Text Superscript Format

### 1-Based Numbering Convention
Every source in the `sources` array must be indexed with its 1-based citation number:
- Format: `{ _key: "source-${num}", _type: "source", name: "${num}. ${title}", uri: url }`
- Example: `{ _key: "source-49", _type: "source", name: "49. Environmental Protection Agency VSL Guidelines", uri: "https://www.epa.gov/..." }`

### In-Text Citations
In the body markdown, citations are formatted as HTML `<sup>` tags:
```markdown
Economic evaluations frequently apply the Value of a Statistical Life (VSL) metric to weigh preventative safety interventions against regulatory burdens.<sup>49</sup>
```

For multiple citations:
```markdown
Subsequent meta-analyses corroborated these risk-compensation differentials.<sup>15, 16</sup>
```

### HTML-to-Blocks Deserialization
When converting markdown to Portable Text in [`convex/_lib/adk/sanity_publisher.ts`](../../../../convex/_lib/adk/sanity_publisher.ts), `htmlToBlocks` deserializes `<sup>` and `<sub>` tags into valid Portable Text marks:

```typescript
rules: [
  {
    deserialize(el, next) {
      if (el.nodeName.toLowerCase() === "sup") {
        return {
          _type: "__decorator",
          name: "sup",
          children: next(el.childNodes),
        };
      }
      if (el.nodeName.toLowerCase() === "sub") {
        return {
          _type: "__decorator",
          name: "sub",
          children: next(el.childNodes),
        };
      }
      return undefined;
    },
  },
]
```

### Frontend Rendering
In [`components/portable-text.tsx`](../../../../components/portable-text.tsx), `sup` marks are rendered with high-aesthetic editorial styling:

```tsx
sup: ({ children }) => (
  <sup className="text-[0.7em] font-semibold text-blue-600 dark:text-blue-400 ml-0.5 leading-none align-super">
    {children}
  </sup>
)
```

---

## 3. Cleaning Bibliography Entries

When extracting sources from a Google Doc "Works Cited" or "References" section:

1. **Remove Access Timestamps**:
   - Strip expressions like `, accessed May 16, 2026,` or `accessed [Date]`.
2. **Remove List Numbering from Raw Title**:
   - Strip leading `1. `, `[1] `, `- `, or `• ` to prevent double numbering (e.g., `1. 1. Title`).
3. **Clean Trailing Punctuation**:
   - Strip trailing commas, periods, or dashes before the URL.
4. **URL Validation & Normalization**:
   - Ensure the URL starts with `http://` or `https://`.
   - Remove trailing commas or parentheses erroneously captured from markdown links.
5. **Fallback Titles**:
   - If a citation entry only contains a URL without descriptive text, extract the hostname and first path segment as a legible title.

---

## 4. Expandable Sources UI (`ExpandableSources`)

Frontend component: [`components/expandable-sources.tsx`](../../../../components/expandable-sources.tsx)

### Key Capabilities
- **Uncapped Storage**: The publisher script must **never** slice sources (e.g., `.slice(0, 15)`). All citations (even 100+) are stored in Sanity.
- **Initial View**: Renders the first 10 source cards by default to keep the page clean.
- **Counter Pill**: Displays the total count of sources in a subtle pill badge.
- **Search Filtering**: When expanded, reveals an instant search input allowing readers to filter sources by number, title, or domain.
- **Responsive Layout**: Asymmetrical 2-column grid on desktop, single-column on mobile.

---

## 5. Dual-Dataset Synchronization & Asset Preservation

Sanity operates with two distinct datasets in this application:
1. `production` (live site)
2. `development` (preview and local development)

### Authentication
- **Use `SANITY_API_DEVELOPER_TOKEN`**: The standard `SANITY_API_WRITE_TOKEN` lacks write permissions on the production dataset, resulting in HTTP 403 Forbidden errors. Always ensure `getSanityClient()` uses `process.env.SANITY_API_DEVELOPER_TOKEN`.

### Asset Protection Pattern
To prevent accidentally wiping manually uploaded cover art:

```typescript
// 1. Fetch current document state
const existing = await client.getDocument(postId);

// 2. Retain existing coverImage reference if already present
const fieldsToUpdate: Record<string, unknown> = {
  content: portableTextBlocks,
  sources: parsedSources,
};

if (existing?.coverImage && !fieldsToUpdate.coverImage) {
  fieldsToUpdate.coverImage = existing.coverImage;
}

// 3. Commit patch to published document
await client.patch(postId).set(fieldsToUpdate).commit();

// 4. Also synchronize Studio draft document if present
const draftId = `drafts.${postId}`;
const draft = await client.getDocument(draftId);
if (draft) {
  await client.patch(draftId).set(fieldsToUpdate).commit();
}
```
