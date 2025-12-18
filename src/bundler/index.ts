/**
 * Schema bundler - bundles schemas for distribution
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { BundledRegistry, ColorSpecification } from "./types.js";
import { getSubdirectories } from "./utils.js";
import { bundleSchemaFromDirectory } from "./bundle-schema.js";

/**
 * Bundle a single schema from its directory
 */
async function bundleSchema(
  schemaDir: string,
  schemaSlug: string,
): Promise<ColorSpecification> {
  // Use shared bundling logic
  const bundled = await bundleSchemaFromDirectory(schemaDir);

  // Add slug from folder name
  bundled.slug = schemaSlug;

  return bundled;
}

/**
 * Bundle all schemas from a category (types or functions)
 */
async function bundleCategory(
  categoryDir: string,
): Promise<ColorSpecification[]> {
  const bundles: ColorSpecification[] = [];
  const schemaSlugs = await getSubdirectories(categoryDir);

  for (const slug of schemaSlugs) {
    const schemaDir = join(categoryDir, slug);
    console.log(`  Bundling ${slug}...`);

    try {
      const bundle = await bundleSchema(schemaDir, slug);
      bundles.push(bundle);
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
): Promise<BundledRegistry> {
  // Bundle types
  console.log("\nBundling type schemas...");
  const typesDir = join(schemasDir, "types");
  const types = await bundleCategory(typesDir);
  console.log(`✓ Bundled ${types.length} type schemas`);

  // Bundle functions
  console.log("\nBundling function schemas...");
  const functionsDir = join(schemasDir, "functions");
  const functions = await bundleCategory(functionsDir);
  console.log(`✓ Bundled ${functions.length} function schemas`);

  // Create bundled registry
  const registry: BundledRegistry = {
    version: "0.0.10",
    types,
    functions,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalSchemas: types.length + functions.length,
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
  await writeFile(
    typesPath,
    JSON.stringify({ version: registry.version, types }, null, 2),
  );
  console.log(`✓ Written types bundle to ${typesPath}`);

  const functionsPath = join(outputDir, "functions.json");
  await writeFile(
    functionsPath,
    JSON.stringify({ version: registry.version, functions }, null, 2),
  );
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

export type * from "./types.js";
