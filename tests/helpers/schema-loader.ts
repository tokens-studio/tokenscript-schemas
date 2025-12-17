/**
 * Test helper for loading schemas directly from source
 * This allows tests to run without building/bundling first
 */

import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMAS_DIR = join(__dirname, "../../src/schemas");

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

interface LoadedSchema {
  slug: string;
  name: string;
  type: "type" | "function";
  version: string;
  metadata: SchemaMetadata;
  schemaDefinition?: unknown;
  scripts: Record<string, string>;
}

/**
 * Check if a path is a directory
 */
async function isDirectory(path: string): Promise<boolean> {
  try {
    const { stat } = await import("node:fs/promises");
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Load a schema directly from source
 */
export async function loadSchemaFromSource(
  slug: string,
  type: "type" | "function",
): Promise<LoadedSchema | null> {
  const categoryDir = type === "type" ? "types" : "functions";
  const schemaDir = join(SCHEMAS_DIR, categoryDir, slug);

  if (!(await isDirectory(schemaDir))) {
    return null;
  }

  // Read schema.json
  const schemaJsonPath = join(schemaDir, "schema.json");
  const metadata = JSON.parse(
    await readFile(schemaJsonPath, "utf-8"),
  ) as SchemaMetadata;

  // Read schema-definition.json if it exists
  let schemaDefinition: unknown | undefined;
  try {
    const schemaDefPath = join(schemaDir, "schema-definition.json");
    schemaDefinition = JSON.parse(await readFile(schemaDefPath, "utf-8"));
  } catch {
    // Schema definition is optional
  }

  // Read all .tokenscript files
  const scripts: Record<string, string> = {};
  const entries = await readdir(schemaDir);

  for (const entry of entries) {
    if (entry.endsWith(".tokenscript")) {
      const scriptPath = join(schemaDir, entry);
      const content = await readFile(scriptPath, "utf-8");
      const scriptName = entry.replace(".tokenscript", "");
      scripts[scriptName] = content;
    }
  }

  return {
    slug: metadata.slug,
    name: metadata.name,
    type: metadata.type,
    version: metadata.version,
    metadata,
    schemaDefinition,
    scripts,
  };
}

/**
 * Load all schemas of a specific type from source
 */
export async function loadSchemasFromSource(
  type: "type" | "function",
): Promise<LoadedSchema[]> {
  const categoryDir = type === "type" ? "types" : "functions";
  const categoryPath = join(SCHEMAS_DIR, categoryDir);

  const entries = await readdir(categoryPath);
  const schemas: LoadedSchema[] = [];

  for (const entry of entries) {
    const entryPath = join(categoryPath, entry);
    if (await isDirectory(entryPath)) {
      const schema = await loadSchemaFromSource(entry, type);
      if (schema) {
        schemas.push(schema);
      }
    }
  }

  return schemas;
}

/**
 * Get a TokenScript from a schema
 */
export function getScript(schema: LoadedSchema, scriptName: string): string | null {
  return schema.scripts[scriptName] || null;
}
