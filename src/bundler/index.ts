/**
 * Schema bundler - bundles schemas for distribution
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { bundleSchemaFromDirectory } from "@/bundler/bundle-schema";
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
 * Bundle a single schema from its directory
 */
async function bundleSchema(schemaDir: string, schemaSlug: string): Promise<SchemaSpecification> {
  // Use shared bundling logic with baseUrl for build-time
  const bundled = await bundleSchemaFromDirectory(schemaDir, {
    baseUrl: DEFAULT_REGISTRY_URL,
  });

  // Add slug from folder name
  bundled.slug = schemaSlug;

  return bundled;
}

/**
 * Bundle all color type schemas from a category directory
 */
async function bundleTypeCategory(categoryDir: string): Promise<ColorSpecification[]> {
  const bundles: ColorSpecification[] = [];
  const schemaSlugs = await getSubdirectories(categoryDir);

  for (const slug of schemaSlugs) {
    const schemaDir = join(categoryDir, slug);
    console.log(`  Bundling ${slug}...`);

    try {
      const bundle = await bundleSchema(schemaDir, slug);
      if (bundle.type === "color") {
        bundles.push(bundle as ColorSpecification);
      }
    } catch (error) {
      console.error(`  ✗ Failed to bundle ${slug}:`, error);
    }
  }

  return bundles;
}

/**
 * Bundle all function schemas from a category directory
 */
async function bundleFunctionCategory(categoryDir: string): Promise<FunctionSpecification[]> {
  const bundles: FunctionSpecification[] = [];
  const schemaSlugs = await getSubdirectories(categoryDir);

  for (const slug of schemaSlugs) {
    const schemaDir = join(categoryDir, slug);
    console.log(`  Bundling ${slug}...`);

    try {
      const bundle = await bundleSchema(schemaDir, slug);
      if (bundle.type === "function") {
        bundles.push(bundle as FunctionSpecification);
      }
    } catch (error) {
      console.error(`  ✗ Failed to bundle ${slug}:`, error);
    }
  }

  return bundles;
}

/**
 * Bundle all schemas from the schemas directory
 */
export async function bundleAllSchemas(
  schemasDir: string,
  outputDir: string,
  options?: { cliArgs?: string[] },
): Promise<BundledRegistry> {
  // Bundle types
  console.log("\nBundling type schemas...");
  const typesDir = join(schemasDir, "types");
  const types = await bundleTypeCategory(typesDir);
  console.log(`✓ Bundled ${types.length} type schemas`);

  // Bundle functions
  console.log("\nBundling function schemas...");
  const functionsDir = join(schemasDir, "functions");
  const functions = await bundleFunctionCategory(functionsDir);
  console.log(`✓ Bundled ${functions.length} function schemas`);

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
