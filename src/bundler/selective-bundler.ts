/**
 * Selective schema bundler for CLI
 * Bundles specific schemas with automatic dependency resolution
 */

import { access } from "node:fs/promises";
import { join } from "node:path";
import { buildSchemaFromDirectory } from "./build-schema.js";
import {
  collectDependencyTree,
  collectRequiredSchemasForList,
  type DependencyNode,
} from "./schema-dependency-resolver.js";
import type { ColorSpecification, FunctionSpecification } from "./types.js";

export interface SelectiveBundleOptions {
  schemas: string[]; // Schema slugs to bundle
  schemasDir?: string; // Source directory (default: src/schemas)
  baseUrl?: string; // Registry URL for URIs
  cliArgs?: string[]; // CLI arguments used
}

export interface BundledSchemaEntry {
  uri: string;
  schema: ColorSpecification | FunctionSpecification;
}

export interface SelectiveBundleResult {
  schemas: BundledSchemaEntry[];
  metadata: {
    requestedSchemas: string[];
    resolvedDependencies: string[];
    generatedAt: string;
    generatedBy?: string;
  };
  dependencyTree: Map<string, DependencyNode>;
}

/**
 * Detect whether a schema is a type or function by checking which directory exists
 */
async function detectSchemaType(
  slug: string,
  schemasDir: string,
): Promise<"type" | "function" | null> {
  const typeDir = join(schemasDir, "types", slug);
  const functionDir = join(schemasDir, "functions", slug);

  try {
    await access(typeDir);
    return "type";
  } catch {
    // Not a type, try function
  }

  try {
    await access(functionDir);
    return "function";
  } catch {
    // Not found in either
  }

  return null;
}

/**
 * Bundle specific schemas with automatic dependency resolution
 */
export async function bundleSelectiveSchemas(
  options: SelectiveBundleOptions,
): Promise<SelectiveBundleResult> {
  const schemasDir = options.schemasDir || join(process.cwd(), "src/schemas");
  const baseUrl = options.baseUrl || "https://schema.tokenscript.dev.gcp.tokens.studio";

  // Parse schema slugs - they might have type prefixes like "function:invert"
  const parsedSchemas = await Promise.all(
    options.schemas.map(async (slug) => {
      if (slug.includes(":")) {
        const [type, name] = slug.split(":");
        return {
          slug: name,
          type: (type === "function" ? "function" : "type") as "type" | "function",
        };
      }

      // Auto-detect type by checking which directory exists
      const detectedType = await detectSchemaType(slug, schemasDir);
      if (detectedType === null) {
        throw new Error(
          `Schema '${slug}' not found in types or functions directories. ` +
            `Use 'function:${slug}' or 'type:${slug}' prefix to be explicit.`,
        );
      }

      return { slug, type: detectedType };
    }),
  );

  // Collect all required schemas (including dependencies)
  // For CLI bundling, we include color type dependencies so conversions work
  const deps = await collectRequiredSchemasForList(parsedSchemas, {
    baseUrl,
    schemasDir,
    includeColorTypeDependencies: true,
  });

  // Collect dependency tree for all schemas (including resolved dependencies)
  const allParsedSchemas = [
    ...deps.types.map((slug) => ({ slug, type: "type" as const })),
    ...deps.functions.map((slug) => ({ slug, type: "function" as const })),
  ];
  const dependencyTree = await collectDependencyTree(allParsedSchemas, {
    baseUrl,
    schemasDir,
    includeColorTypeDependencies: true,
  });

  // Track all schema slugs for metadata
  const allSchemas = [...new Set([...deps.types, ...deps.functions])];

  // Bundle all schemas
  const bundledSchemas: BundledSchemaEntry[] = [];

  // Bundle type schemas
  for (const typeSlug of deps.types) {
    const schemaDir = join(schemasDir, "types", typeSlug);
    const bundled = await buildSchemaFromDirectory(schemaDir, { baseUrl });

    if (bundled.type === "color") {
      const uri = `${baseUrl}/api/v1/core/${typeSlug}/0/`;
      bundledSchemas.push({
        uri,
        schema: bundled as ColorSpecification,
      });
    }
  }

  // Bundle function schemas
  for (const funcSlug of deps.functions) {
    const schemaDir = join(schemasDir, "functions", funcSlug);
    const bundled = await buildSchemaFromDirectory(schemaDir, { baseUrl });

    if (bundled.type === "function") {
      const uri = `${baseUrl}/api/v1/function/${funcSlug}/0/`;
      bundledSchemas.push({
        uri,
        schema: bundled as FunctionSpecification,
      });
    }
  }

  // Build generatedBy string if CLI args are provided
  const baseCommand = "npx @tokens-studio/tokenscript-schemas bundle";
  const generatedBy = options.cliArgs?.length
    ? `${baseCommand} ${options.cliArgs.join(" ")}`
    : undefined;

  return {
    schemas: bundledSchemas,
    metadata: {
      requestedSchemas: options.schemas,
      resolvedDependencies: allSchemas,
      generatedAt: new Date().toISOString(),
      generatedBy,
    },
    dependencyTree,
  };
}
