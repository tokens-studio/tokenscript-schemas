/**
 * Schema bundler - bundles schemas for distribution
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildSchemaFromDirectory } from "@/bundler/build-schema";
import type {
  BundledRegistry,
  ColorSpecification,
  FunctionSpecification,
  SchemaSpecification,
} from "@/bundler/types.js";
import { getSubdirectories } from "@/bundler/utils";

/**
 * Default registry URL for build-time bundling
 */
const DEFAULT_REGISTRY_URL = "https://schema.tokenscript.dev.gcp.tokens.studio";

/**
 * Build a single schema from its directory
 */
async function buildSchema(schemaDir: string, schemaSlug: string): Promise<SchemaSpecification> {
  // Use shared build logic with baseUrl for build-time
  const bundled = await buildSchemaFromDirectory(schemaDir, {
    baseUrl: DEFAULT_REGISTRY_URL,
  });

  // Add slug from folder name
  bundled.slug = schemaSlug;

  return bundled;
}

/**
 * Build all color type schemas from a category directory
 */
async function buildTypeCategory(categoryDir: string): Promise<ColorSpecification[]> {
  const bundles: ColorSpecification[] = [];
  const schemaSlugs = await getSubdirectories(categoryDir);

  for (const slug of schemaSlugs) {
    const schemaDir = join(categoryDir, slug);
    console.log(`  Building ${slug}...`);

    try {
      const bundle = await buildSchema(schemaDir, slug);
      if (bundle.type === "color") {
        bundles.push(bundle as ColorSpecification);
      }
    } catch (error) {
      console.error(`  ✗ Failed to build ${slug}:`, error);
    }
  }

  return bundles;
}

/**
 * Build all function schemas from a category directory
 */
async function buildFunctionCategory(categoryDir: string): Promise<FunctionSpecification[]> {
  const bundles: FunctionSpecification[] = [];
  const schemaSlugs = await getSubdirectories(categoryDir);

  for (const slug of schemaSlugs) {
    const schemaDir = join(categoryDir, slug);
    console.log(`  Building ${slug}...`);

    try {
      const bundle = await buildSchema(schemaDir, slug);
      if (bundle.type === "function") {
        bundles.push(bundle as FunctionSpecification);
      }
    } catch (error) {
      console.error(`  ✗ Failed to build ${slug}:`, error);
    }
  }

  return bundles;
}

/**
 * Build all schemas from the schemas directory
 */
export async function buildAllSchemas(
  schemasDir: string,
  outputDir: string,
  options?: { cliArgs?: string[] },
): Promise<BundledRegistry> {
  // Build types
  console.log("\nBuilding type schemas...");
  const typesDir = join(schemasDir, "types");
  const types = await buildTypeCategory(typesDir);
  console.log(`✓ Built ${types.length} type schemas`);

  // Build functions
  console.log("\nBuilding function schemas...");
  const functionsDir = join(schemasDir, "functions");
  const functions = await buildFunctionCategory(functionsDir);
  console.log(`✓ Built ${functions.length} function schemas`);

  // Create bundled registry
  const baseCommand = "npx @tokens-studio/tokenscript-schemas bundle";
  const generatedBy = options?.cliArgs?.length
    ? `${baseCommand} ${options.cliArgs.join(" ")}`
    : baseCommand;

  const registry: BundledRegistry = {
    version: "0.0.10",
    types,
    functions,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalSchemas: types.length + functions.length,
      generatedBy,
    },
  };

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  // Write complete registry
  const registryPath = join(outputDir, "registry.json");
  await writeFile(registryPath, JSON.stringify(registry, null, 2));
  console.log(`\n✓ Written complete registry to ${registryPath}`);

  // Write individual category bundles
  const typesPath = join(outputDir, "types.json");
  await writeFile(typesPath, JSON.stringify({ version: registry.version, types }, null, 2));
  console.log(`✓ Written types bundle to ${typesPath}`);

  const functionsPath = join(outputDir, "functions.json");
  await writeFile(functionsPath, JSON.stringify({ version: registry.version, functions }, null, 2));
  console.log(`✓ Written functions bundle to ${functionsPath}`);

  // Write individual schema bundles
  const typesOutputDir = join(outputDir, "types");
  await mkdir(typesOutputDir, { recursive: true });
  for (const type of types) {
    const typePath = join(typesOutputDir, `${type.slug}.json`);
    await writeFile(typePath, JSON.stringify(type, null, 2));
  }
  console.log(`✓ Written ${types.length} individual type schemas`);

  const functionsOutputDir = join(outputDir, "functions");
  await mkdir(functionsOutputDir, { recursive: true });
  for (const func of functions) {
    const funcPath = join(functionsOutputDir, `${func.slug}.json`);
    await writeFile(funcPath, JSON.stringify(func, null, 2));
  }
  console.log(`✓ Written ${functions.length} individual function schemas`);

  return registry;
}

export type * from "@/bundler/types.js";
