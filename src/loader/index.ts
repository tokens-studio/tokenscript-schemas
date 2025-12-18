/**
 * Schema loader - provides access to bundled schemas
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BundledRegistry, ColorSpecification } from "@/bundler/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the bundled schemas directory path - works in both dev and built environments
 */
function getBundledPath(...paths: string[]): string {
  // When running from source (tests), go to package root bundled
  // When running from built code, bundled is relative to dist
  const sourceBundledPath = join(__dirname, "../../bundled", ...paths);
  const builtBundledPath = join(__dirname, "../bundled", ...paths);

  // Try to detect which environment we're in
  // If __dirname contains 'src/', we're in source mode
  if (__dirname.includes("/src/")) {
    return sourceBundledPath;
  }

  return builtBundledPath;
}

/**
 * Load the complete schema registry
 */
export async function loadRegistry(): Promise<BundledRegistry> {
  const registryPath = getBundledPath("registry.json");
  const content = await readFile(registryPath, "utf-8");
  return JSON.parse(content) as BundledRegistry;
}

/**
 * Load all type schemas
 */
export async function loadTypes(): Promise<ColorSpecification[]> {
  const typesPath = getBundledPath("types.json");
  const content = await readFile(typesPath, "utf-8");
  const data = JSON.parse(content) as { version: string; types: ColorSpecification[] };
  return data.types;
}

/**
 * Load all function schemas
 */
export async function loadFunctions(): Promise<ColorSpecification[]> {
  const functionsPath = getBundledPath("functions.json");
  const content = await readFile(functionsPath, "utf-8");
  const data = JSON.parse(content) as { version: string; functions: ColorSpecification[] };
  return data.functions;
}

/**
 * Load a specific schema by slug
 */
export async function loadSchema(
  slug: string,
  type: "type" | "function",
): Promise<ColorSpecification | null> {
  const categoryPath = type === "type" ? "types" : "functions";
  const schemaPath = getBundledPath(categoryPath, `${slug}.json`);

  try {
    const content = await readFile(schemaPath, "utf-8");
    return JSON.parse(content) as ColorSpecification;
  } catch {
    return null;
  }
}
