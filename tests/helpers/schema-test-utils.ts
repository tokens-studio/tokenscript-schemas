/**
 * Testing utilities for schema tests
 */

import {
  ColorManager,
  Config,
  Interpreter,
  Lexer,
  Parser,
  serializeInterpreterResult,
} from "@tokens-studio/tokenscript-interpreter";
import { loadSchemaFromSource, getScript } from "./schema-loader.js";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Strip metadata comment lines starting with # from the beginning of the script
 * These are documentation/metadata lines, not actual TokenScript code
 */
function stripMetadataComments(code: string): string {
  const lines = code.split("\n");
  const codeLines: string[] = [];
  let inMetadata = true;

  for (const line of lines) {
    const trimmed = line.trim();
    if (inMetadata && trimmed.startsWith("#")) {
      continue;
    }
    if (trimmed.length > 0) {
      inMetadata = false;
    }
    codeLines.push(line);
  }

  return codeLines.join("\n");
}

/**
 * Create a Config with color schemas registered
 */
async function createConfigWithColors(): Promise<Config> {
  const colorManager = new ColorManager();
  
  const schemaDir = join(__dirname, "../../src/schemas/types");
  const colorSchemas = ["hsl-color", "srgb-color", "rgb-color", "rgba-color", "oklch-color"];
  
  for (const slug of colorSchemas) {
    try {
      const schemaDefPath = join(schemaDir, slug, "schema-definition.json");
      const schemaData = await readFile(schemaDefPath, "utf-8");
      colorManager.register(`https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/schema/${slug}/0/`, schemaData);
    } catch {
      // Schema might not exist, skip
    }
  }
  
  return new Config({ colorManager });
}

let configCache: Config | null = null;

/**
 * Execute a TokenScript code with input
 */
export async function executeScript<TInput = unknown, TOutput = unknown>(
  code: string,
  input: TInput,
): Promise<TOutput> {
  if (!configCache) {
    configCache = await createConfigWithColors();
  }

  const cleanCode = stripMetadataComments(code);
  const lexer = new Lexer(cleanCode);
  const parser = new Parser(lexer);
  const ast = parser.parse(false);

  const interpreter = new Interpreter(ast, {
    references: { input },
    config: configCache,
  });

  const result = interpreter.interpret();
  const serialized = serializeInterpreterResult(result);

  return serialized as TOutput;
}

/**
 * Load a schema and get a specific script
 */
export async function loadSchemaScript(
  slug: string,
  type: "type" | "function",
  scriptName: string,
): Promise<string> {
  const schema = await loadSchemaFromSource(slug, type);
  if (!schema) {
    throw new Error(`Schema ${slug} not found`);
  }

  const script = getScript(schema, scriptName);
  if (!script) {
    throw new Error(`Script ${scriptName} not found in schema ${slug}`);
  }

  return script;
}
