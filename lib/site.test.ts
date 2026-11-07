import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  PRODUCTION_DOMAIN,
  PRODUCTION_URL,
  AUTHOR_NAME,
  AUTHOR_SITE_DOMAIN,
  AUTHOR_SITE_URL,
  getSiteUrl,
  getCanonicalUrl,
} from "./site";

describe("lib/site.ts", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.SITE_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_ENV;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("exports the correct production domain and URL", () => {
    expect(PRODUCTION_DOMAIN).toBe("blog.agnivon.dev");
    expect(PRODUCTION_URL).toBe("https://blog.agnivon.dev");
  });

  it("exports the correct author name and site URL", () => {
    expect(AUTHOR_NAME).toBe("Agnivo Neogi");
    expect(AUTHOR_SITE_DOMAIN).toBe("agnivon.dev");
    expect(AUTHOR_SITE_URL).toBe("https://agnivon.dev");
  });

  it("resolves canonical URL pointing to the production domain by default", () => {
    expect(getCanonicalUrl()).toBe("https://blog.agnivon.dev");
    expect(getCanonicalUrl("/")).toBe("https://blog.agnivon.dev");
    expect(getCanonicalUrl("/posts/welcome-to-my-blog")).toBe(
      "https://blog.agnivon.dev/posts/welcome-to-my-blog"
    );
    expect(getCanonicalUrl("feed.xml")).toBe(
      "https://blog.agnivon.dev/feed.xml"
    );
  });

  it("respects NEXT_PUBLIC_SITE_URL when set", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://custom.dev";
    expect(getSiteUrl()).toBe("https://custom.dev");
    expect(getCanonicalUrl("/posts")).toBe("https://custom.dev/posts");
  });

  it("adds https protocol if NEXT_PUBLIC_SITE_URL lacks it", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "blog.agnivon.dev";
    expect(getSiteUrl()).toBe("https://blog.agnivon.dev");
  });

  it("uses VERCEL_URL for preview deployments", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "personal-blog-git-feat.vercel.app";
    expect(getSiteUrl()).toBe("https://personal-blog-git-feat.vercel.app");
    // But canonical URL still points to production!
    expect(getCanonicalUrl("/posts/slug")).toBe(
      "https://blog.agnivon.dev/posts/slug"
    );
  });

  it("uses PRODUCTION_URL when NODE_ENV is production without explicit env vars", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    expect(getSiteUrl()).toBe("https://blog.agnivon.dev");
  });

  it("falls back to localhost in dev environment", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});
