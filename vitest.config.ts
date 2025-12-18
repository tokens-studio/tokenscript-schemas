import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
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
