/**
 * Bundler utilities
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

/**
 * Check if a path is a directory
 */
export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Get all subdirectories in a directory
 */
export async function getSubdirectories(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  const subdirs: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (await isDirectory(fullPath)) {
      subdirs.push(entry);
    }
  }

  return subdirs;
}

/**
 * Read all tokenscript files from a schema directory
 */
export async function readTokenScriptFiles(schemaDir: string): Promise<Record<string, string>> {
  const entries = await readdir(schemaDir);
  const scripts: Record<string, string> = {};

  for (const entry of entries) {
    if (entry.endsWith(".tokenscript")) {
      const filePath = join(schemaDir, entry);
      const content = await readFile(filePath, "utf-8");
      const scriptName = entry.replace(".tokenscript", "");
      scripts[scriptName] = content;
    }
  }

  return scripts;
}

/**
 * Read and parse a JSON file
 */
export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content) as T;
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}
