/**
 * Build command - Build individual schema directories
 */

/// <reference types="../../../types/ulog" />

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import anylogger from "ulog";
import { buildSchemaFromDirectory } from "@/bundler/build-schema.js";

const log = anylogger("build-dir");

export interface BuildDirOptions {
  output?: string;
  pretty?: boolean;
}

/**
 * Build a schema from a directory containing schema.json
 */
export async function buildSchemaDir(
  schemaDir: string,
  options: BuildDirOptions = {},
): Promise<void> {
  const resolvedDir = resolveSchemaDir(schemaDir);

  if (!existsSync(resolvedDir)) {
    throw new Error(`Directory not found: ${resolvedDir}`);
  }

  const schemaJsonPath = join(resolvedDir, "schema.json");
  if (!existsSync(schemaJsonPath)) {
    throw new Error(`schema.json not found in: ${resolvedDir}`);
  }

  log.info(`Building schema from: ${resolvedDir}`);

  // Build the schema using shared bundler logic
  const schema = await buildSchemaFromDirectory(resolvedDir);

  // Generate output
  const output = options.pretty ? JSON.stringify(schema, null, 2) : JSON.stringify(schema);

  // Write to stdout or file
  if (options.output) {
    await mkdir(dirname(options.output), { recursive: true });
    await writeFile(options.output, output, "utf-8");
    log.info(`Output written to: ${options.output}`);
    console.log(`✓ Built ${schema.type}:${schema.name} → ${options.output}`);
  } else {
    console.log(output);
  }
}

/**
 * Resolve schema directory - handles relative paths
 */
function resolveSchemaDir(schemaDir: string): string {
  // If absolute path, use as-is
  if (existsSync(schemaDir)) {
    return schemaDir;
  }

  // Try relative to current working directory
  const cwd = process.cwd();
  const fromCwd = join(cwd, schemaDir);
  if (existsSync(fromCwd)) {
    return fromCwd;
  }

  // Return as-is and let error handling catch it
  return schemaDir;
}

/**
 * CLI action handler for build command
 */
export async function handleBuildCommand(
  schemaDir: string,
  options: BuildDirOptions = {},
): Promise<void> {
  try {
    await buildSchemaDir(schemaDir, options);
  } catch (error) {
    log.error("Build failed:", error);
    throw error;
  }
}
