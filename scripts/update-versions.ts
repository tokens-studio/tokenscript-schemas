#!/usr/bin/env tsx

/**
 * Update all schema versions to a target version
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { resolve } from "node:path";

const SCHEMAS_DIR = resolve(process.cwd(), "src/schemas");
const TARGET_VERSION = "0.0.10";

interface SchemaMetadata {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: "type" | "function";
  version: string;
  originalVersion: string;
  contentType: string | null;
  metadata: Record<string, unknown>;
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    const { stat } = await import("node:fs/promises");
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function updateSchemaVersion(
  schemaDir: string,
  schemaSlug: string,
): Promise<void> {
  const schemaJsonPath = join(schemaDir, "schema.json");

  // Read current schema
  const content = await readFile(schemaJsonPath, "utf-8");
  const schema = JSON.parse(content) as SchemaMetadata;

  // Update version if different
  if (schema.version !== TARGET_VERSION) {
    schema.version = TARGET_VERSION;

    // Write updated schema
    await writeFile(schemaJsonPath, JSON.stringify(schema, null, 2) + "\n");

    console.log(`✓ Updated ${schemaSlug}: ${schema.originalVersion} → ${TARGET_VERSION}`);
  } else {
    console.log(`  ${schemaSlug}: already at ${TARGET_VERSION}`);
  }
}

async function updateCategory(categoryDir: string): Promise<number> {
  const entries = await readdir(categoryDir);
  let updated = 0;

  for (const entry of entries) {
    const entryPath = join(categoryDir, entry);
    if (await isDirectory(entryPath)) {
      await updateSchemaVersion(entryPath, entry);
      updated++;
    }
  }

  return updated;
}

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("TokenScript Schema Version Updater");
  console.log("=".repeat(60));
  console.log(`Target version: ${TARGET_VERSION}\n`);

  // Update type schemas
  console.log("Updating type schemas...");
  const typesDir = join(SCHEMAS_DIR, "types");
  const typesUpdated = await updateCategory(typesDir);

  // Update function schemas
  console.log("\nUpdating function schemas...");
  const functionsDir = join(SCHEMAS_DIR, "functions");
  const functionsUpdated = await updateCategory(functionsDir);

  console.log("\n" + "=".repeat(60));
  console.log(`✓ Updated ${typesUpdated + functionsUpdated} schemas to version ${TARGET_VERSION}`);
}

try {
  await main();
} catch (error) {
  console.error("\n✗ Failed to update versions:", error);
  process.exit(1);
}
