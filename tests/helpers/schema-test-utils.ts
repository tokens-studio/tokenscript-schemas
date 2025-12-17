/**
 * Testing utilities for schema tests
 */

import {
  ColorManager,
  Config,
  Interpreter,
  Lexer,
  Parser,
} from "@tokens-studio/tokenscript-interpreter";
import type { ColorSpecification } from "./schema-loader.js";
import { loadSchemaFromSource, bundleSchemaForRuntime } from "./schema-loader.js";

// Re-export Config for convenience
export { Config };

/**
 * Setup ColorManager with a schema loaded from source with runtime bundling
 */
export async function setupColorManagerWithSchema(
  slug: string,
): Promise<ColorManager> {
  const colorManager = new ColorManager();

  // Bundle the schema at runtime (inline script references)
  const bundled = await bundleSchemaForRuntime(slug, "type");

  // Register with a URI format that matches the schema
  const uri = `https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/schema/${slug}/0/`;
  colorManager.register(uri, bundled);

  return colorManager;
}

/**
 * Setup ColorManager with multiple schemas
 */
export async function setupColorManagerWithSchemas(
  slugs: string[],
): Promise<ColorManager> {
  const colorManager = new ColorManager();

  for (const slug of slugs) {
    try {
      const bundled = await bundleSchemaForRuntime(slug, "type");
      const uri = `https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/schema/${slug}/0/`;
      colorManager.register(uri, bundled);
    } catch (error) {
      console.warn(`Failed to load schema ${slug}:`, error);
    }
  }

  return colorManager;
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
export async function getBundledSchema(slug: string): Promise<ColorSpecification> {
  return bundleSchemaForRuntime(slug, "type");
}
