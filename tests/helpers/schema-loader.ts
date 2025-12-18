/**
 * Test helper for loading schemas directly from source
 * This allows tests to run without building/bundling first
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  ColorSpecification,
  FunctionSpecification,
  SchemaSpecification,
} from "@/bundler/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMAS_DIR = join(__dirname, "../../src/schemas");

// Re-export types
export type { ColorSpecification, FunctionSpecification, SchemaSpecification };

interface LoadedSchema {
  slug: string;
  specification: SchemaSpecification;
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
 * Load a schema directly from source with runtime bundling
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

  // Read schema.json (contains full specification)
  const schemaJsonPath = join(schemaDir, "schema.json");
  const specification = JSON.parse(await readFile(schemaJsonPath, "utf-8")) as SchemaSpecification;

  // Read all .tokenscript files into a map
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
    slug,
    specification,
    scripts,
  };
}

/**
 * Load all schemas of a specific type from source
 */
export async function loadSchemasFromSource(type: "type" | "function"): Promise<LoadedSchema[]> {
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
 * Get a TokenScript from a schema by name
 */
export function getScript(schema: LoadedSchema, scriptName: string): string | null {
  return schema.scripts[scriptName] || null;
}

/**
 * Bundle a schema for runtime use by using the shared bundling logic
 */
export async function bundleSchemaForRuntime(
  slug: string,
  type: "type" | "function" = "type",
  baseUrl?: string,
): Promise<SchemaSpecification> {
  // Import the shared bundling function
  const { bundleSchemaFromDirectory } = await import("@/bundler/bundle-schema.js");

  const categoryDir = type === "type" ? "types" : "functions";
  const schemaDir = join(SCHEMAS_DIR, categoryDir, slug);

  return await bundleSchemaFromDirectory(schemaDir, baseUrl ? { baseUrl } : undefined);
}
