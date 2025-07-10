import { article } from "@/test_structured_article";
import { convexTest } from "convex-test";
import fs from "fs";
import { expect, test } from "vitest";
import { createBlockContent, createPost } from "./sanity";
import { internal } from "../_generated/api";

test("create block content", async () => {
  const content = createBlockContent(
    fs.readFileSync("./test_content.md", "utf-8")
  );
  //   console.log(content);
  expect(content).toBeTruthy();
});

test.skip("create post", async () => {
  const result = await createPost(article);
  console.log(result);
  expect(result).toBeTruthy();
});

test(
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
