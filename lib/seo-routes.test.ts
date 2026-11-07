import { describe, it, expect } from "vitest";
import robots from "@/app/robots";
import manifest from "@/app/manifest";

describe("Metadata Routes", () => {
  it("generates correct robots.txt configuration", () => {
    const robotsConfig = robots();
    expect(robotsConfig.sitemap).toBe("https://blog.agnivon.dev/sitemap.xml");
    expect(robotsConfig.host).toBe("blog.agnivon.dev");
    expect(robotsConfig.rules).toBeDefined();

    const rules = Array.isArray(robotsConfig.rules)
      ? robotsConfig.rules
      : [robotsConfig.rules];

    const allAgentsRule = rules.find((r) => r.userAgent === "*");
    expect(allAgentsRule).toBeDefined();
    expect(allAgentsRule?.allow).toBe("/");
    expect(allAgentsRule?.disallow).toContain("/api/");
    expect(allAgentsRule?.disallow).toContain("/studio/");
  });

  it("generates correct manifest.json configuration", () => {
    const manifestConfig = manifest();
    expect(manifestConfig.name).toContain("Agnivo Neogi");
    expect(manifestConfig.start_url).toBe("/");
    expect(manifestConfig.display).toBe("standalone");
    expect(manifestConfig.icons).toBeDefined();
    expect(manifestConfig.icons?.length).toBeGreaterThan(0);
  });
});
