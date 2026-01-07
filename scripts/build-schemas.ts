#!/usr/bin/env tsx

/**
 * Build all schemas for distribution
 */

import { resolve } from "node:path";
import { buildAllSchemas } from "@/bundler/index";

const schemasDir = resolve(process.cwd(), "src/schemas");
const outputDir = resolve(process.cwd(), "result");

// Get CLI arguments (skip first 2 which are node and script path)
const cliArgs = process.argv.slice(2);

console.log("=".repeat(60));
console.log("TokenScript Schema Builder");
console.log("=".repeat(60));
console.log(`Source directory: ${schemasDir}`);
console.log(`Output directory: ${outputDir}`);

try {
  const registry = await buildAllSchemas(schemasDir, outputDir, { cliArgs });

  console.log(`\n${"=".repeat(60)}`);
  console.log("Build Summary:");
  console.log("=".repeat(60));
  console.log(`Types: ${registry.types.length}`);
  console.log(`Functions: ${registry.functions.length}`);
  console.log(`Total: ${registry.metadata.totalSchemas}`);
  console.log(`Version: ${registry.version}`);
  console.log(`Generated: ${registry.metadata.generatedAt}`);
  console.log("\n✓ All schemas built successfully!");
} catch (error) {
  console.error("\n✗ Failed to build schemas:", error);
  process.exit(1);
}
