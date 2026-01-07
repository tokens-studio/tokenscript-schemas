import { resolve } from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "cli/index": "src/cli/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outDir: "dist",
  esbuildOptions(options) {
    options.alias = {
      "@": resolve(__dirname, "./src"),
      "@tests": resolve(__dirname, "./tests"),
    };
    // Define build-time constant to indicate this is a built package
    options.define = {
      ...options.define,
      __IS_BUILT_PACKAGE__: "true",
    };
  },
});
