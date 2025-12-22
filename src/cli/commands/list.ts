/**
 * List command - Display available schemas
 */

/// <reference types="../../../types/ulog" />

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import anylogger from "ulog";

const log = anylogger("list");

export interface ListOptions {
  types?: boolean;
  functions?: boolean;
}

interface ListResult {
  types: string[];
  functions: string[];
}

/**
 * List all available schemas
 */
export async function listSchemas(
  schemasDir: string = join(process.cwd(), "src/schemas"),
  options: ListOptions = {},
): Promise<ListResult> {
  const showTypes = options.types || (!options.types && !options.functions);
  const showFunctions = options.functions || (!options.types && !options.functions);

  const types: string[] = [];
  const functions: string[] = [];

  // List type schemas
  if (showTypes) {
    try {
      const typesDir = join(schemasDir, "types");
      const typeEntries = await readdir(typesDir, { withFileTypes: true });
      types.push(
        ...typeEntries
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
          .sort(),
      );
    } catch (error) {
      log.warn("Could not read types directory:", error);
    }
  }

  // List function schemas
  if (showFunctions) {
    try {
      const functionsDir = join(schemasDir, "functions");
      const funcEntries = await readdir(functionsDir, { withFileTypes: true });
      functions.push(
        ...funcEntries
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
          .sort(),
      );
    } catch (error) {
      log.warn("Could not read functions directory:", error);
    }
  }

  return { types, functions };
}

/**
 * Format list output for display
 */
export function formatListOutput(result: ListResult, options: ListOptions = {}): string {
  const lines: string[] = [];

  const showTypes = options.types || (!options.types && !options.functions);
  const showFunctions = options.functions || (!options.types && !options.functions);

  if (showTypes && result.types.length > 0) {
    lines.push("Types:");
    for (const type of result.types) {
      lines.push(`  ${type}`);
    }
  }

  if (showFunctions && result.functions.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Functions:");
    for (const func of result.functions) {
      lines.push(`  function:${func}`);
    }
  }

  if (lines.length === 0) {
    lines.push("No schemas found.");
  }

  return lines.join("\n");
}

/**
 * CLI action handler for list command
 */
export async function handleListCommand(options: ListOptions = {}): Promise<void> {
  const result = await listSchemas(undefined, options);
  const output = formatListOutput(result, options);
  console.log(output);
}
