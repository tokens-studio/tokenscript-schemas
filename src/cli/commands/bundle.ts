/**
 * Bundle command - Bundle schemas into a JS file
 */

/// <reference types="../../../types/ulog" />

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import anylogger from "ulog";
import { bundleSelectiveSchemas } from "@/bundler/selective-bundler.js";
import { type BundleConfig, validateBundleConfig } from "@/cli/config-schema.js";
import { generateOutput } from "@/cli/output-generator.js";
import { isSome } from "@/utils/type.js";

const log = anylogger("bundle");

export interface BundleOptions {
  config?: string;
  output?: string;
  dryRun?: boolean;
}

/**
 * Load config from file
 */
async function loadConfig(configPath: string): Promise<BundleConfig> {
  try {
    const content = await readFile(configPath, "utf-8");
    const parsed = JSON.parse(content);
    return validateBundleConfig(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Config file not found: ${configPath}`);
    }
    throw error;
  }
}

/**
 * Format dependency tree for display
 */
function formatDependencyTree(
  tree: Map<string, import("@/bundler/schema-dependency-resolver.js").DependencyNode>,
  requestedSchemas: string[],
): string {
  const lines: string[] = [];
  const visited = new Set<string>();

  lines.push("Dependency tree:");
  lines.push("");

  // Helper to format a node
  const formatNode = (key: string, indent: string = "", isLast: boolean = true) => {
    if (visited.has(key)) {
      return;
    }
    visited.add(key);

    const node = tree.get(key);
    if (!node) return;

    const prefix = indent + (isLast ? "└── " : "├── ");
    const label = `${node.type}:${node.slug}`;
    lines.push(prefix + label);

    if (node.dependencies.length > 0) {
      const childIndent = indent + (isLast ? "    " : "│   ");
      node.dependencies.forEach((dep, idx) => {
        const isLastChild = idx === node.dependencies.length - 1;
        const childKey = dep;

        if (!visited.has(childKey)) {
          formatNode(childKey, childIndent, isLastChild);
        }
      });
    }
  };

  // Format requested schemas
  requestedSchemas.forEach((schema, idx) => {
    // Try to find the schema with different type prefixes
    const typeKey = `type:${schema}`;
    const funcKey = `function:${schema}`;
    const key = tree.has(typeKey) ? typeKey : tree.has(funcKey) ? funcKey : schema;

    formatNode(key, "", idx === requestedSchemas.length - 1);
  });

  return lines.join("\n");
}

/**
 * Format bundle result for dry-run display
 */
function formatDryRunOutput(schemas: string[], resolvedDependencies: string[]): string {
  const lines: string[] = [];

  lines.push("Bundle preview:");
  lines.push("");
  lines.push(`Requested schemas: ${schemas.join(", ")}`);
  lines.push(`Total schemas (with dependencies): ${resolvedDependencies.length}`);
  lines.push("");
  lines.push("Schemas to be bundled:");

  for (const schema of resolvedDependencies.sort()) {
    lines.push(`  - ${schema}`);
  }

  return lines.join("\n");
}

/**
 * Find the schemas directory - works for both development/tests and installed package
 */
function findSchemasDir(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // From source src/cli/commands/bundle.ts to src/schemas (for tests/dev)
  const fromSource = join(__dirname, "../../schemas");

  // From compiled dist/cli/commands/bundle.js to src/schemas
  const fromDist = join(__dirname, "../../../src/schemas");

  // Try to detect which one exists (check source first for dev)
  try {
    const fs = require("node:fs");
    if (fs.existsSync(fromSource)) {
      return fromSource;
    }
    if (fs.existsSync(fromDist)) {
      return fromDist;
    }
  } catch {
    // If fs checks fail, default to source structure
  }

  // Default to source structure (for development)
  return fromSource;
}

/**
 * Core bundle logic (testable)
 */
export async function bundleSchemas(
  schemas: string[],
  schemasDir?: string,
  cliArgs?: string[],
): Promise<{
  output: string;
  metadata: any;
  dependencyTree: Map<string, import("@/bundler/schema-dependency-resolver.js").DependencyNode>;
}> {
  // Use provided schemasDir or auto-detect
  const resolvedSchemasDir = schemasDir || findSchemasDir();

  log.info("Bundling schemas:", schemas);
  log.debug("Schemas directory:", resolvedSchemasDir);

  // Bundle schemas with dependencies
  const result = await bundleSelectiveSchemas({
    schemas,
    schemasDir: resolvedSchemasDir,
    cliArgs,
  });

  log.info(
    `Resolved ${result.metadata.resolvedDependencies.length} schemas (including dependencies)`,
  );

  // Generate output
  const output = generateOutput({
    schemas: result.schemas,
    includeHelper: true,
    generatedBy: result.metadata.generatedBy,
  });

  return {
    output,
    metadata: result.metadata,
    dependencyTree: result.dependencyTree,
  };
}

/**
 * CLI action handler for bundle command
 */
export async function handleBundleCommand(
  schemas: string[],
  options: BundleOptions = {},
): Promise<void> {
  try {
    // Load config if provided
    let configSchemas: string[] = schemas;
    let outputPath = options.output || "./tokenscript-schemas.js";

    if (isSome(options.config)) {
      log.info(`Loading config from ${options.config}`);
      const config = await loadConfig(options.config);
      configSchemas = config.schemas;
      if (config.output) {
        outputPath = config.output;
      }
    }

    // Validate we have schemas
    if (!configSchemas || configSchemas.length === 0) {
      throw new Error("No schemas specified. Provide schemas as arguments or via --config");
    }

    // Build CLI args array for generatedBy metadata
    const cliArgs: string[] = [];
    if (schemas.length > 0) {
      cliArgs.push(...schemas);
    }
    if (options.config) {
      cliArgs.push("--config", options.config);
    }
    if (options.output) {
      cliArgs.push("--output", options.output);
    }
    if (options.dryRun) {
      cliArgs.push("--dry-run");
    }

    // Bundle schemas
    const { output, metadata, dependencyTree } = await bundleSchemas(
      configSchemas,
      undefined,
      cliArgs,
    );

    // Show dependency tree
    console.log("");
    console.log(formatDependencyTree(dependencyTree, metadata.requestedSchemas));
    console.log("");

    // Dry run - just show what would be bundled
    if (options.dryRun) {
      const preview = formatDryRunOutput(metadata.requestedSchemas, metadata.resolvedDependencies);
      console.log(preview);
      return;
    }

    // Write output file
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, output, "utf-8");

    log.info(`Successfully bundled ${metadata.resolvedDependencies.length} schemas`);
    log.info(`Output written to: ${outputPath}`);

    // Summary
    console.log(`✓ Bundled ${metadata.resolvedDependencies.length} schemas → ${outputPath}`);
  } catch (error) {
    log.error("Bundle failed:", error);
    throw error;
  }
}
