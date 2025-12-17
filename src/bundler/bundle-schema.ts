/**
 * Shared schema bundling logic
 * Used by both the build-time bundler and runtime test helpers
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ColorSpecification } from "./types.js";

/**
 * Replace script file references with actual content
 * This is the core bundling logic shared by build and runtime
 */
export async function bundleSchemaFromDirectory(
  schemaDir: string,
): Promise<ColorSpecification> {
  // Read schema.json which contains the full specification
  const schemaJsonPath = join(schemaDir, "schema.json");
  const schemaContent = await readFile(schemaJsonPath, "utf-8");
  const schema = JSON.parse(schemaContent) as ColorSpecification;

  return await inlineScriptReferences(schemaDir, schema);
}

/**
 * Inline script file references in a schema specification
 */
async function inlineScriptReferences(
  schemaDir: string,
  schema: ColorSpecification,
): Promise<ColorSpecification> {
  const result = JSON.parse(JSON.stringify(schema)) as ColorSpecification;

  // Inline initializer scripts
  for (const initializer of result.initializers) {
    if (initializer.script.script.startsWith("./")) {
      const scriptPath = join(schemaDir, initializer.script.script.slice(2));
      const scriptContent = await readFile(scriptPath, "utf-8");
      initializer.script.script = scriptContent.trim();
    }
  }

  // Inline conversion scripts
  for (const conversion of result.conversions) {
    if (conversion.script.script.startsWith("./")) {
      const scriptPath = join(schemaDir, conversion.script.script.slice(2));
      const scriptContent = await readFile(scriptPath, "utf-8");
      conversion.script.script = scriptContent.trim();
    }
  }

  return result;
}
