import { defineConfig } from "tsup";
import { resolve } from "node:path";

export default defineConfig({
  entry: ["src/index.ts"],
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
  },
});
