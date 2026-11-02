import { convexTest } from "convex-test";
import fs from "fs";
import { describe, expect, it, test } from "vitest";
import {
  extractExcerptFromMarkdown,
  stripMarkdown,
} from "./adk/sanity-publisher";
import { createBlockContent, createPost } from "./sanity";
import { internal } from "../_generated/api";

const mockArticle = {
  title: "Test Article Title",
  excerpt: "Test excerpt summary.",
  content: "## Introduction\n\nThis is a test article body.",
};

describe("Sanity Post Creation & Markdown Processing", () => {
  it("strips markdown formatting to plain text", () => {
    const md =
      "### Heading\n\nThis is **bold**, *italic*, and `code` with a [link](https://example.com).\n\n> Quote\n\n- item 1\n- item 2";
    const plain = stripMarkdown(md);
    expect(plain).not.toContain("**");
    expect(plain).not.toContain("###");
    expect(plain).not.toContain("`");
    expect(plain).not.toContain("[link]");
    expect(plain).toContain("bold");
    expect(plain).toContain("italic");
    expect(plain).toContain("code");
    expect(plain).toContain("link");
  });

  it("extracts a clean excerpt from the first paragraph of markdown content", () => {
    const md = `
# Main Title

This is the opening introductory paragraph of the article discussing important concepts in detail.

## Second Section

More text here.
`;
    const excerpt = extractExcerptFromMarkdown(md, 100);
    expect(excerpt).toBe(
      "This is the opening introductory paragraph of the article discussing important concepts in detail."
    );
  });

  it("truncates long excerpts at a word boundary", () => {
    const md =
      "This is a very long paragraph that goes on and on with lots of interesting information that will definitely exceed thirty characters.";
    const excerpt = extractExcerptFromMarkdown(md, 35);
    expect(excerpt.endsWith("...")).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(38);
  });
});

test("create block content", async () => {
  const content = createBlockContent(
    fs.readFileSync("./test_content.md", "utf-8")
  );
  expect(content).toBeTruthy();
});

test.skip("create post", async () => {
  const result = await createPost(mockArticle);
  console.log(result);
  expect(result).toBeTruthy();
});

// Live generation test - requires available Gemini API quota
test.skipIf(!process.env.RUN_LIVE_GENERATION_TEST)(
  "generate article",
  {
    timeout: 1000 * 500,
  },
  async () => {
    const t = convexTest();
    const result = await t.action(internal.actions.generateArticle, {
      topic: "Sadism",
    });
    expect(result).toBeTruthy();
  }
);
