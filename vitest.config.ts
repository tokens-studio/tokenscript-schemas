import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Limit parallelism to prevent CPU overload
    maxConcurrency: 5,
    pool: "forks",
    poolOptions: {
      forks: {
        maxForks: 4,
        minForks: 1,
      },
    },
    watchExclude: ["**/node_modules/**", "**/dist/**", "**/bundled/**", "**/.git/**"],
    forceRerunTriggers: ["**/src/schemas/**/*.tokenscript", "**/src/schemas/**/*.json"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@tests": resolve(__dirname, "./tests"),
    },
  },
});
