import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    server: { deps: { inline: ["convex-test"] } },
    env: loadEnv(mode, process.cwd(), ""),
  },
}));
