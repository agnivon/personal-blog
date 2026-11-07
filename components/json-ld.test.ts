import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateWebsiteJsonLd,
  generateArticleJsonLd,
  generateArchivesJsonLd,
} from "./json-ld";

describe("components/json-ld.tsx", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("generates valid WebSite and Person JSON-LD for homepage", () => {
    const data = generateWebsiteJsonLd("Test Blog", "A test blog description");
    expect(data["@context"]).toBe("https://schema.org");
    const graph = data["@graph"] as Array<Record<string, unknown>>;
    expect(graph).toHaveLength(3);

    const website = graph.find((item) => item["@type"] === "WebSite");
    expect(website?.url).toBe("https://blog.agnivon.dev");
    expect(website?.name).toBe("Test Blog");

    const person = graph.find((item) => item["@type"] === "Person");
    expect(person?.name).toBe("Agnivo Neogi");
    expect(person?.url).toBe("https://agnivon.dev");

    const blog = graph.find((item) => item["@type"] === "Blog");
    expect(blog?.url).toBe("https://blog.agnivon.dev");
  });

  it("generates valid BlogPosting and BreadcrumbList for post page", () => {
    const post = {
      title: "Understanding Next.js 16 App Router",
      slug: "nextjs-16-app-router",
      excerpt: "A deep dive into Next.js 16 features.",
      date: "2026-11-01T10:00:00Z",
      _updatedAt: "2026-11-02T12:00:00Z",
      author: { name: "Agnivo Neogi" },
    };

    const data = generateArticleJsonLd(post);
    expect(data["@context"]).toBe("https://schema.org");
    const graph = data["@graph"] as Array<Record<string, unknown>>;
    expect(graph).toHaveLength(2);

    const article = graph.find((item) => item["@type"] === "BlogPosting");
    expect(article?.headline).toBe(post.title);
    expect(article?.url).toBe(
      "https://blog.agnivon.dev/posts/nextjs-16-app-router"
    );
    expect(article?.datePublished).toBe(post.date);
    expect(article?.dateModified).toBe(post._updatedAt);

    const breadcrumbs = graph.find(
      (item) => item["@type"] === "BreadcrumbList"
    );
    expect(breadcrumbs).toBeDefined();
    const items = breadcrumbs?.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(3);
    expect(items[0].name).toBe("Home");
    expect(items[1].name).toBe("Articles");
    expect(items[2].name).toBe(post.title);
  });

  it("generates valid CollectionPage and Breadcrumbs for archives page", () => {
    const data = generateArchivesJsonLd();
    expect(data["@context"]).toBe("https://schema.org");
    const graph = data["@graph"] as Array<Record<string, unknown>>;
    expect(graph).toHaveLength(2);

    const collection = graph.find((item) => item["@type"] === "CollectionPage");
    expect(collection?.url).toBe("https://blog.agnivon.dev/posts");

    const breadcrumbs = graph.find(
      (item) => item["@type"] === "BreadcrumbList"
    );
    expect(breadcrumbs).toBeDefined();
  });
});
