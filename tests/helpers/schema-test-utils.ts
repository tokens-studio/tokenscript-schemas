/**
 * Testing utilities for schema tests
 */

import {
  ColorManager,
  Config,
  FunctionsManager,
  Interpreter,
  Lexer,
  Parser,
} from "@tokens-studio/tokenscript-interpreter";
import type { ColorSpecification, SchemaSpecification } from "./schema-loader.js";
import { bundleSchemaForRuntime } from "./schema-loader.js";

// Re-export Config for convenience
export { Config };

/**
 * Default registry URL for test runtime bundling
 */
const DEFAULT_REGISTRY_URL = "https://schema.tokenscript.dev.gcp.tokens.studio";

/**
 * Setup ColorManager with a schema loaded from source with runtime bundling
 */
export async function setupColorManagerWithSchema(
  slug: string,
): Promise<ColorManager> {
  const colorManager = new ColorManager();

  // Bundle the schema at runtime (inline script references) WITH baseUrl transformation
  const bundled = await bundleSchemaForRuntime(slug, "type", DEFAULT_REGISTRY_URL);

  // Register with a URI format that matches the conversions: /api/v1/core/{slug}/0/
  const uri = `${DEFAULT_REGISTRY_URL}/api/v1/core/${slug}/0/`;
  colorManager.register(uri, bundled);

  return colorManager;
}

/**
 * Setup Config with multiple schemas (colors and functions)
 */
export async function setupColorManagerWithSchemas(
  slugs: string[],
  types?: Array<"type" | "function">,
): Promise<Config> {
  const colorManager = new ColorManager();
  const functionsManager = new FunctionsManager();
  const config = new Config({ colorManager, functionsManager });

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const type = types?.[i] || "type";
    
    try {
      const bundled = await bundleSchemaForRuntime(slug, type, DEFAULT_REGISTRY_URL);
      
      if (type === "function") {
        // Register as a function
        functionsManager.register(slug, bundled as any);
      } else {
        // Register as a color type
        const uri = `${DEFAULT_REGISTRY_URL}/api/v1/core/${slug}/0/`;
        colorManager.register(uri, bundled);
      }
    } catch (error) {
      console.warn(`Failed to load schema ${slug}:`, error);
    }
  }

  return config;
}

/**
 * Create interpreter for testing with schema
 */
export function createInterpreter(
  code: string,
  references: Record<string, any> = {},
  config?: Config,
): Interpreter {
  const lexer = new Lexer(code);
  const parser = new Parser(lexer);
  return new Interpreter(parser, { references, config });
}

/**
 * Get a bundled schema for testing
 */
export async function getBundledSchema(
  slug: string,
  type: "type" | "function" = "type",
): Promise<SchemaSpecification> {
  return bundleSchemaForRuntime(slug, type, DEFAULT_REGISTRY_URL);
}
