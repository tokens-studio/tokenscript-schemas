/**
 * Shared schema bundling logic
 * Used by both the build-time bundler and runtime test helpers
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ColorSpecification, FunctionSpecification, SchemaSpecification } from "@/bundler/types.js";

export interface BundleOptions {
  /**
   * Base URL to prepend to relative schema URIs
   * If provided, transforms /api/v1/... to https://domain.com/api/v1/...
   * If not provided, keeps URIs as-is (useful for tests)
   */
  baseUrl?: string;
}

/**
 * Replace script file references with actual content
 * This is the core bundling logic shared by build and runtime
 */
export async function bundleSchemaFromDirectory(
  schemaDir: string,
  options?: BundleOptions,
): Promise<SchemaSpecification> {
  // Read schema.json which contains the full specification
  const schemaJsonPath = join(schemaDir, "schema.json");
  const schemaContent = await readFile(schemaJsonPath, "utf-8");
  const schema = JSON.parse(schemaContent) as SchemaSpecification;

  if (schema.type === "function") {
    return await inlineFunctionScriptReferences(schemaDir, schema as FunctionSpecification, options);
  } else {
    return await inlineColorScriptReferences(schemaDir, schema as ColorSpecification, options);
  }
}

/**
 * Inline script file references in a color schema specification
 */
async function inlineColorScriptReferences(
  schemaDir: string,
  schema: ColorSpecification,
  options?: BundleOptions,
): Promise<ColorSpecification> {
  const result = JSON.parse(JSON.stringify(schema)) as ColorSpecification;

  // Inline initializer scripts and transform URIs
  for (const initializer of result.initializers) {
    if (initializer.script.script.startsWith("./")) {
      const scriptPath = join(schemaDir, initializer.script.script.slice(2));
      const scriptContent = await readFile(scriptPath, "utf-8");
      initializer.script.script = scriptContent.trim();
    }
    
    // Transform script type URI if baseUrl is provided
    if (options?.baseUrl) {
      initializer.script.type = addBaseUrl(initializer.script.type, options.baseUrl);
    }
  }

  // Inline conversion scripts and transform URIs
  for (const conversion of result.conversions) {
    if (conversion.script.script.startsWith("./")) {
      const scriptPath = join(schemaDir, conversion.script.script.slice(2));
      const scriptContent = await readFile(scriptPath, "utf-8");
      conversion.script.script = scriptContent.trim();
    }
    
    // Transform URIs if baseUrl is provided
    if (options?.baseUrl) {
      conversion.script.type = addBaseUrl(conversion.script.type, options.baseUrl);
      
      // Transform source and target URIs (but not $self)
      if (conversion.source !== "$self") {
        conversion.source = addBaseUrl(conversion.source, options.baseUrl);
      }
      if (conversion.target !== "$self") {
        conversion.target = addBaseUrl(conversion.target, options.baseUrl);
      }
    }
  }

  return result;
}

/**
 * Inline script file references in a function specification
 */
async function inlineFunctionScriptReferences(
  schemaDir: string,
  schema: FunctionSpecification,
  options?: BundleOptions,
): Promise<FunctionSpecification> {
  const result = JSON.parse(JSON.stringify(schema)) as FunctionSpecification;

  // Inline the main function script
  if (result.script.script.startsWith("./")) {
    const scriptPath = join(schemaDir, result.script.script.slice(2));
    const scriptContent = await readFile(scriptPath, "utf-8");
    result.script.script = scriptContent.trim();
  }

  // Transform script type URI if baseUrl is provided
  if (options?.baseUrl) {
    result.script.type = addBaseUrl(result.script.type, options.baseUrl);
    
    // Transform requirement URIs
    if (result.requirements) {
      result.requirements = result.requirements.map(req => addBaseUrl(req, options.baseUrl));
    }
  }

  return result;
}

/**
 * Add base URL to relative schema URIs
 * Transforms /api/v1/... to https://domain.com/api/v1/...
 */
function addBaseUrl(uri: string, baseUrl: string): string {
  // If URI already has a protocol, return as-is
  if (uri.includes("://")) {
    return uri;
  }
  
  // If URI is relative (starts with /), prepend base URL
  if (uri.startsWith("/")) {
    // Remove trailing slash from baseUrl if present
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}${uri}`;
  }
  
  // Otherwise return as-is (e.g., $self)
  return uri;
}
