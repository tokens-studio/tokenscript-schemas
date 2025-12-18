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
import type {
  ColorSpecification,
  FunctionSpecification,
  SchemaSpecification,
} from "@/bundler/types";
import {
  collectRequiredSchemas,
  collectRequiredSchemasForList,
  type ResolvedDependencies,
} from "./schema-dependency-resolver";
import { bundleSchemaForRuntime } from "./schema-loader";

// Re-export Config and types for convenience
export { Config };
export type { ResolvedDependencies };

/**
 * Default registry URL for test runtime bundling
 */
const DEFAULT_REGISTRY_URL = "https://schema.tokenscript.dev.gcp.tokens.studio";

/**
 * Setup ColorManager with a schema loaded from source with runtime bundling
 */
export async function setupColorManagerWithSchema(slug: string): Promise<ColorManager> {
  const colorManager = new ColorManager();

  // Bundle the schema at runtime (inline script references) WITH baseUrl transformation
  const bundled = await bundleSchemaForRuntime(slug, "type", DEFAULT_REGISTRY_URL);

  // Type guard: ensure it's a ColorSpecification
  if (bundled.type !== "color") {
    throw new Error(`Expected color type for ${slug}, got ${bundled.type}`);
  }

  // Register with a URI format that matches the conversions: /api/v1/core/{slug}/0/
  const uri = `${DEFAULT_REGISTRY_URL}/api/v1/core/${slug}/0/`;
  colorManager.register(uri, bundled as ColorSpecification);

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
        // Ensure it's actually a function specification
        if (bundled.type !== "function") {
          throw new Error(`Expected function type for ${slug}, got ${bundled.type}`);
        }
        const funcSpec = bundled as FunctionSpecification;
        // Register as a function
        functionsManager.register(slug, funcSpec);
      } else {
        // Ensure it's actually a color specification
        if (bundled.type !== "color") {
          throw new Error(`Expected color type for ${slug}, got ${bundled.type}`);
        }
        const colorSpec = bundled as ColorSpecification;
        // Register as a color type
        const uri = `${DEFAULT_REGISTRY_URL}/api/v1/core/${slug}/0/`;
        colorManager.register(uri, colorSpec);
      }
    } catch (error) {
      console.warn(`Failed to load schema ${slug}:`, error);
    }
  }

  return config;
}

/**
 * Execute a TokenScript code snippet with automatic schema dependency setup
 *
 * This helper simplifies the common test pattern of:
 * 1. Setting up config with dependencies
 * 2. Creating interpreter with code
 * 3. Interpreting and returning the result
 *
 * @param schemaSlug - The schema slug to load (e.g., "invert", "rgb-color")
 * @param schemaType - The schema type ("type" or "function")
 * @param code - The TokenScript code to execute
 * @param references - Optional variable references for the interpreter
 * @returns The interpretation result
 *
 * @example
 * // Test a function
 * const result = await executeWithSchema("invert", "function", `
 *   variable black: Color.Hex = #000000;
 *   invert(black)
 * `);
 * expect(result?.constructor.name).toBe("ColorSymbol");
 *
 * @example
 * // Test a color conversion
 * const result = await executeWithSchema("rgb-color", "type", `
 *   variable c: Color.Rgb = rgb(255, 128, 64);
 *   c.to.hex()
 * `);
 * expect(result?.toString()).toBe("#ff8040");
 */
export async function executeWithSchema(
  schemaSlug: string,
  schemaType: "type" | "function",
  code: string,
  references: Record<string, any> = {},
): Promise<any> {
  const config = await setupConfigWithDependencies(schemaSlug, schemaType);
  const interpreter = createInterpreter(code, references, config);
  return interpreter.interpret();
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

/**
 * Automatically setup Config with a schema and all its dependencies
 * This function will recursively collect all required schemas
 *
 * @param slugOrUri - Schema slug (e.g., "rgb-color") or full URI
 * @param type - Schema type ("type" or "function"), optional if URI is provided
 * @returns Config with all required schemas loaded
 *
 * @example
 * // Load a function and all its dependencies
 * const config = await setupConfigWithDependencies("invert", "function");
 * // This will automatically load: invert (function) + rgb-color + hex-color (types)
 *
 * @example
 * // Load a color type and its dependencies
 * const config = await setupConfigWithDependencies("rgb-color");
 * // This will automatically load: rgb-color + hex-color (types)
 *
 * @example
 * // Using URI
 * const config = await setupConfigWithDependencies("/api/v1/core/rgb-color/0/");
 */
export async function setupConfigWithDependencies(
  slugOrUri: string,
  type?: "type" | "function",
): Promise<Config> {
  const colorManager = new ColorManager();
  const functionsManager = new FunctionsManager();
  const config = new Config({ colorManager, functionsManager });

  // Collect all required schemas
  const deps = await collectRequiredSchemas(slugOrUri, type, DEFAULT_REGISTRY_URL);

  // Load all type dependencies
  for (const typeSlug of deps.types) {
    try {
      const bundled = await bundleSchemaForRuntime(typeSlug, "type", DEFAULT_REGISTRY_URL);
      if (bundled.type === "color") {
        const uri = `${DEFAULT_REGISTRY_URL}/api/v1/core/${typeSlug}/0/`;
        colorManager.register(uri, bundled as ColorSpecification);
      }
    } catch (error) {
      console.warn(`Failed to load type schema ${typeSlug}:`, error);
    }
  }

  // Load all function dependencies
  for (const funcSlug of deps.functions) {
    try {
      const bundled = await bundleSchemaForRuntime(funcSlug, "function", DEFAULT_REGISTRY_URL);
      if (bundled.type === "function") {
        functionsManager.register(funcSlug, bundled as FunctionSpecification);
      }
    } catch (error) {
      console.warn(`Failed to load function schema ${funcSlug}:`, error);
    }
  }

  // Load the main schema itself
  try {
    // Resolve to get the actual slug
    const { resolveSchemaReference } = await import("./schema-dependency-resolver");
    const ref = resolveSchemaReference(slugOrUri);

    if (!ref) {
      throw new Error(`Could not resolve schema reference: ${slugOrUri}`);
    }

    const actualSlug = ref.slug;
    const actualType = type || ref.type;

    const mainSchema = await bundleSchemaForRuntime(actualSlug, actualType, DEFAULT_REGISTRY_URL);

    if (mainSchema.type === "function") {
      functionsManager.register(actualSlug, mainSchema as FunctionSpecification);
    } else if (mainSchema.type === "color") {
      const uri = `${DEFAULT_REGISTRY_URL}/api/v1/core/${actualSlug}/0/`;
      colorManager.register(uri, mainSchema as ColorSpecification);
    }
  } catch (error) {
    console.warn(`Failed to load main schema ${slugOrUri}:`, error);
  }

  return config;
}

/**
 * Setup Config with multiple schemas and their dependencies
 *
 * @example
 * const config = await setupConfigWithMultipleDependencies([
 *   { slug: "invert", type: "function" },
 *   { slug: "rgb-color", type: "type" }
 * ]);
 */
export async function setupConfigWithMultipleDependencies(
  schemas: Array<{ slug: string; type: "type" | "function" }>,
): Promise<Config> {
  const colorManager = new ColorManager();
  const functionsManager = new FunctionsManager();
  const config = new Config({ colorManager, functionsManager });

  // Collect all required schemas (including dependencies)
  const deps = await collectRequiredSchemasForList(schemas, DEFAULT_REGISTRY_URL);

  // Load all type schemas
  for (const typeSlug of deps.types) {
    try {
      const bundled = await bundleSchemaForRuntime(typeSlug, "type", DEFAULT_REGISTRY_URL);
      if (bundled.type === "color") {
        const uri = `${DEFAULT_REGISTRY_URL}/api/v1/core/${typeSlug}/0/`;
        colorManager.register(uri, bundled as ColorSpecification);
      }
    } catch (error) {
      console.warn(`Failed to load type schema ${typeSlug}:`, error);
    }
  }

  // Load all function schemas
  for (const funcSlug of deps.functions) {
    try {
      const bundled = await bundleSchemaForRuntime(funcSlug, "function", DEFAULT_REGISTRY_URL);
      if (bundled.type === "function") {
        functionsManager.register(funcSlug, bundled as FunctionSpecification);
      }
    } catch (error) {
      console.warn(`Failed to load function schema ${funcSlug}:`, error);
    }
  }

  return config;
}
