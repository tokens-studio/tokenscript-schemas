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

// Types matching the new schema format (from typescript-interpreter)
interface ScriptBlock {
  type: string;
  script: string;
}

interface Initializer {
  title?: string;
  keyword: string;
  description?: string;
  schema?: unknown;
  script: ScriptBlock;
}

interface Conversion {
  source: string;
  target: string;
  description?: string;
  lossless: boolean;
  script: ScriptBlock;
}

interface SpecProperty {
  type: "number" | "string" | "color";
}

interface SpecSchema {
  type: "object";
  properties: Record<string, SpecProperty>;
  required?: string[];
  order?: string[];
  additionalProperties?: boolean;
}

export interface ColorSpecification {
  name: string;
  type: "color";
  description?: string;
  schema?: SpecSchema;
  initializers: Initializer[];
  conversions: Conversion[];
}

interface LoadedSchema {
  slug: string;
  specification: ColorSpecification;
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
  const specification = JSON.parse(
    await readFile(schemaJsonPath, "utf-8"),
  ) as ColorSpecification;

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
): Promise<ColorSpecification> {
  // Import the shared bundling function
  const { bundleSchemaFromDirectory } = await import("../../src/bundler/bundle-schema.js");
  
  const categoryDir = type === "type" ? "types" : "functions";
  const schemaDir = join(SCHEMAS_DIR, categoryDir, slug);

  return await bundleSchemaFromDirectory(schemaDir, baseUrl ? { baseUrl } : undefined);
}
