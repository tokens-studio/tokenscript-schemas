/**
 * Utilities for resolving schema dependencies automatically
 */

import { join } from "node:path";
import type {
  ColorSpecification,
  FunctionSpecification,
  SchemaSpecification,
} from "@/bundler/types.js";
import { extractSchemaName, parseSchemaUri } from "@/utils/schema-uri";
import { bundleSchemaFromDirectory } from "./bundle-schema.js";

export interface SchemaReference {
  slug: string;
  type: "type" | "function";
  uri: string;
}

export interface ExtractRequirementsOptions {
  /**
   * Whether to include type dependencies from color conversions
   * Useful for testing to ensure all conversion types are loaded
   * @default false
   */
  includeColorTypeDependencies?: boolean;
}

/**
 * Extract all required schema URIs from a schema specification
 * Only extracts explicit requirements - not conversions (which are capabilities, not dependencies)
 * However, for testing purposes, can optionally include color type dependencies from conversions
 */
function extractRequirements(
  spec: SchemaSpecification,
  options: ExtractRequirementsOptions = {},
): string[] {
  const requirements: string[] = [];

  if (spec.type === "function") {
    // Functions can have explicit requirements
    const funcSpec = spec as FunctionSpecification;
    if (funcSpec.requirements) {
      requirements.push(...funcSpec.requirements);
    }
  } else if (spec.type === "color" && options.includeColorTypeDependencies) {
    // Color types have requirements through conversions (when flag is enabled)
    // This is useful for testing to ensure all conversion types are loaded
    const colorSpec = spec as ColorSpecification;
    for (const conversion of colorSpec.conversions || []) {
      // Add source if it's not $self
      if (conversion.source !== "$self") {
        requirements.push(conversion.source);
      }
      // Add target if it's not $self
      if (conversion.target !== "$self") {
        requirements.push(conversion.target);
      }
    }
  }
  // Note: By default, color types don't have dependencies via conversions
  // Conversions are capabilities, not requirements

  return requirements;
}

/**
 * Resolve a URI to a schema slug and type
 * Works with both full URIs and just schema names
 *
 * @example
 * resolveSchemaReference("/api/v1/core/rgb-color/0/") => { slug: "rgb-color", type: "type" }
 * resolveSchemaReference("rgb-color") => { slug: "rgb-color", type: "type" }
 */
export function resolveSchemaReference(uriOrName: string): SchemaReference | null {
  // Try parsing as URI first
  const components = parseSchemaUri(uriOrName);

  if (components) {
    // Successfully parsed as URI
    const type = components.category === "function" ? "function" : "type";
    return {
      slug: components.name,
      type,
      uri: uriOrName,
    };
  }

  // Try extracting name (handles partial URIs)
  const extractedName = extractSchemaName(uriOrName);
  if (extractedName) {
    return {
      slug: extractedName,
      type: "type", // Default to type if we can't determine
      uri: uriOrName,
    };
  }

  // Treat as plain slug
  if (uriOrName && !uriOrName.includes("/")) {
    return {
      slug: uriOrName,
      type: "type", // Default to type
      uri: "", // No URI, just a slug
    };
  }

  return null;
}

export interface ResolvedDependencies {
  types: string[];
  functions: string[];
}

export interface DependencyNode {
  slug: string;
  type: "type" | "function";
  dependencies: string[];
}

export interface CollectRequiredSchemasOptions extends ExtractRequirementsOptions {
  baseUrl?: string;
  schemasDir?: string;
}

/**
 * Recursively collect all required schemas for a given schema
 * Returns a flat list of all dependencies (including transitive ones)
 *
 * @param slugOrUri - Schema slug (e.g., "rgb-color") or full URI
 * @param type - Schema type ("type" or "function"), optional if URI is provided
 * @param options - Options for dependency collection
 * @returns Object with separated type and function dependencies
 *
 * @example
 * // Using slug
 * await collectRequiredSchemas("invert", "function")
 * // => { types: ["rgb-color", "hex-color"], functions: [] }
 *
 * // Using URI
 * await collectRequiredSchemas("/api/v1/core/rgb-color/0/")
 * // => { types: ["hex-color"], functions: [] }
 */
export async function collectRequiredSchemas(
  slugOrUri: string,
  type?: "type" | "function",
  options: CollectRequiredSchemasOptions = {},
): Promise<ResolvedDependencies> {
  const { baseUrl, schemasDir, ...extractOptions } = options;
  const visited = new Set<string>();
  const typeSchemas = new Set<string>();
  const functionSchemas = new Set<string>();

  async function traverse(currentSlugOrUri: string, currentType?: "type" | "function") {
    // Resolve to a proper schema reference
    const ref = resolveSchemaReference(currentSlugOrUri);
    if (!ref) {
      console.warn(`Could not resolve schema reference: ${currentSlugOrUri}`);
      return;
    }

    // Use provided type if available, otherwise use resolved type
    const effectiveType = currentType || ref.type;
    const slug = ref.slug;

    // Create a unique key for visited tracking
    const key = `${effectiveType}:${slug}`;
    if (visited.has(key)) {
      return;
    }
    visited.add(key);

    // Try to load the schema
    let spec: SchemaSpecification;
    try {
      // Dynamically determine schema directory
      const categoryDir = effectiveType === "type" ? "types" : "functions";
      const resolvedSchemasDir =
        schemasDir || process.env.SCHEMAS_DIR || join(process.cwd(), "src/schemas");
      const schemaDir = join(resolvedSchemasDir, categoryDir, slug);

      spec = await bundleSchemaFromDirectory(schemaDir, baseUrl ? { baseUrl } : undefined);
    } catch (error) {
      console.warn(`Failed to load schema ${slug} (${effectiveType}):`, error);
      return;
    }

    // Extract requirements from this schema
    const requirements = extractRequirements(spec, extractOptions);

    // Recursively traverse requirements
    for (const reqUri of requirements) {
      const reqRef = resolveSchemaReference(reqUri);
      if (reqRef) {
        // Add to appropriate set
        if (reqRef.type === "function") {
          functionSchemas.add(reqRef.slug);
        } else {
          typeSchemas.add(reqRef.slug);
        }

        // Recursively collect dependencies
        await traverse(reqUri, reqRef.type);
      }
    }
  }

  // Start traversal
  await traverse(slugOrUri, type);

  return {
    types: Array.from(typeSchemas),
    functions: Array.from(functionSchemas),
  };
}

/**
 * Collect all schemas needed for a list of schemas (including their dependencies)
 *
 * @example
 * await collectRequiredSchemasForList([
 *   { slug: "invert", type: "function" },
 *   { slug: "rgb-color", type: "type" }
 * ])
 * // => { types: ["rgb-color", "hex-color"], functions: ["invert"] }
 */
export async function collectRequiredSchemasForList(
  schemas: Array<{ slug: string; type: "type" | "function" }>,
  options: CollectRequiredSchemasOptions = {},
): Promise<ResolvedDependencies> {
  const allTypes = new Set<string>();
  const allFunctions = new Set<string>();

  for (const schema of schemas) {
    const deps = await collectRequiredSchemas(schema.slug, schema.type, options);

    // Add the schema itself
    if (schema.type === "function") {
      allFunctions.add(schema.slug);
    } else {
      allTypes.add(schema.slug);
    }

    // Add dependencies
    for (const t of deps.types) {
      allTypes.add(t);
    }
    for (const f of deps.functions) {
      allFunctions.add(f);
    }
  }

  return {
    types: Array.from(allTypes),
    functions: Array.from(allFunctions),
  };
}

/**
 * Collect dependency tree for schemas (non-recursive, shows direct dependencies only)
 */
export async function collectDependencyTree(
  schemas: Array<{ slug: string; type: "type" | "function" }>,
  options: CollectRequiredSchemasOptions = {},
): Promise<Map<string, DependencyNode>> {
  const { baseUrl, schemasDir, ...extractOptions } = options;
  const tree = new Map<string, DependencyNode>();

  for (const schema of schemas) {
    const categoryDir = schema.type === "type" ? "types" : "functions";
    const resolvedSchemasDir =
      schemasDir || process.env.SCHEMAS_DIR || join(process.cwd(), "src/schemas");
    const schemaDir = join(resolvedSchemasDir, categoryDir, schema.slug);

    try {
      const spec = await bundleSchemaFromDirectory(schemaDir, baseUrl ? { baseUrl } : undefined);
      const requirements = extractRequirements(spec, extractOptions);

      // Extract just the slugs from URIs
      const dependencySlugs = requirements.map((uri) => {
        const ref = resolveSchemaReference(uri);
        return ref ? `${ref.type}:${ref.slug}` : uri;
      });

      const key = `${schema.type}:${schema.slug}`;
      tree.set(key, {
        slug: schema.slug,
        type: schema.type,
        dependencies: dependencySlugs,
      });
    } catch (error) {
      console.warn(`Failed to load schema ${schema.slug} (${schema.type}):`, error);
    }
  }

  return tree;
}
