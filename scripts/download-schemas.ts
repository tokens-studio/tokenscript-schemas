#!/usr/bin/env tsx

/**
 * Download all schemas from the TokenScript API
 */

import { resolve } from "node:path";
import { downloadAllSchemas } from "@/downloader/index";

const outputDir = resolve(process.cwd(), "src/schemas");

console.log("=".repeat(60));
console.log("TokenScript Schema Downloader");
console.log("=".repeat(60));
console.log(`Output directory: ${outputDir}\n`);

try {
  await downloadAllSchemas({
    outputDir,
  });
} catch (error) {
  console.error("\n✗ Failed to download schemas:", error);
  process.exit(1);
}
