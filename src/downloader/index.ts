/**
 * Schema downloader - fetches schemas from the TokenScript API
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  SchemaConfig,
  SchemaDetails,
  SchemaListItem,
  SchemaVersion,
} from "@/downloader/types.js";

const DEFAULT_CONFIG: SchemaConfig = {
  apiBaseUrl: "https://schema.tokenscript.dev.gcp.tokens.studio/api/v1",
  outputDir: "src/schemas",
  targetVersion: "0.0.10",
};

/**
 * Fetch all schemas from the API
 */
export async function fetchSchemaList(config: SchemaConfig = DEFAULT_CONFIG): Promise<SchemaListItem[]> {
  const url = `${config.apiBaseUrl}/schema/?format=json`;
  
  console.log(`Fetching schema list from ${url}...`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch schemas: ${response.statusText}`);
  }
  
  const data = await response.json() as SchemaListItem[];
  console.log(`Found ${data.length} schemas`);
  
  return data;
}

/**
 * Fetch versions for a schema
 */
export async function fetchSchemaVersions(
  schemaSlug: string,
  config: SchemaConfig = DEFAULT_CONFIG,
): Promise<SchemaVersion[]> {
  const url = `${config.apiBaseUrl}/schema/${schemaSlug}/versions/?format=json`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch versions for ${schemaSlug}: ${response.statusText}`);
  }
  
  return await response.json() as SchemaVersion[];
}

/**
 * Create the folder structure for a schema
 */
async function createSchemaFolder(
  schemaSlug: string,
  schemaType: "type" | "function",
  baseDir: string,
): Promise<string> {
  const schemaPath = join(baseDir, schemaType === "type" ? "types" : "functions", schemaSlug);
  await mkdir(schemaPath, { recursive: true });
  return schemaPath;
}

/**
 * Write schema.json file
 */
async function writeSchemaJson(
  schemaPath: string,
  schema: SchemaDetails,
  targetVersion: string,
): Promise<void> {
  const content = schema.content as any;
  
  const schemaJson = {
    id: schema.id,
    slug: schema.slug,
    name: schema.name,
    description: schema.description,
    type: schema.type,
    version: targetVersion,
    originalVersion: schema.version,
    contentType: content.type || null,
    metadata: schema.metadata || {},
  };
  
  await writeFile(
    join(schemaPath, "schema.json"),
    JSON.stringify(schemaJson, null, 2),
  );
}

/**
 * Generate a unit test stub
 */
async function createUnitTestStub(
  schemaPath: string,
  schemaName: string,
  schemaType: "type" | "function",
): Promise<void> {
  const testContent = `import { describe, test, expect } from "vitest";

describe("${schemaName}", () => {
  test.todo("should implement ${schemaType} functionality");
});
`;
  
  await writeFile(join(schemaPath, "unit.test.ts"), testContent);
}

/**
 * Extract conversion script name from source/target
 */
function getConversionFileName(source: string, target: string): string {
  // Extract the type name from URLs like "https://schema.../core/hex-color/0/"
  const extractType = (url: string): string => {
    const match = url.match(/\/([^/]+)\/\d+\/?$/);
    return match ? match[1] : url;
  };
  
  const sourceType = extractType(source);
  const targetType = extractType(target);
  
  if (target === "$self") {
    return `to-${sourceType}.tokenscript`;
  }
  if (source === "$self") {
    return `from-${targetType}.tokenscript`;
  }
  
  return `${sourceType}-to-${targetType}.tokenscript`;
}

/**
 * Write TokenScript files from schema content
 */
async function writeTokenScriptFiles(
  schemaPath: string,
  schema: SchemaDetails,
): Promise<void> {
  const content = schema.content as any;
  
  // Write the main schema definition as JSON
  if (content.schema) {
    await writeFile(
      join(schemaPath, "schema-definition.json"),
      JSON.stringify(content.schema, null, 2),
    );
  }
  
  // Extract and write conversion scripts
  if (content.conversions && Array.isArray(content.conversions)) {
    for (const conversion of content.conversions) {
      if (conversion.script && conversion.script.script) {
        const fileName = getConversionFileName(
          conversion.source || "",
          conversion.target || "",
        );
        
        // Add description as comment if available
        let scriptContent = "";
        if (conversion.description) {
          scriptContent += `# ${conversion.description}\n`;
          scriptContent += `# Source: ${conversion.source}\n`;
          scriptContent += `# Target: ${conversion.target}\n`;
          scriptContent += `# Lossless: ${conversion.lossless || false}\n\n`;
        }
        
        scriptContent += conversion.script.script;
        
        await writeFile(join(schemaPath, fileName), scriptContent);
      }
    }
  }
  
  // Create initializer if no conversions found
  if (!content.conversions || content.conversions.length === 0) {
    const initializerContent = `# ${schema.name} Initializer
# TODO: Implement initialization logic

`;
    await writeFile(join(schemaPath, "initializer.tokenscript"), initializerContent);
  }
}

/**
 * Download and organize a single schema
 */
export async function downloadSchema(
  schema: SchemaListItem,
  config: SchemaConfig = DEFAULT_CONFIG,
): Promise<void> {
  console.log(`Downloading ${schema.slug}...`);
  
  // Fetch all versions
  const versions = await fetchSchemaVersions(schema.slug, config);
  
  if (versions.length === 0) {
    console.warn(`No versions found for ${schema.slug}, skipping`);
    return;
  }
  
  // Get the latest version (first one)
  const latestVersion = versions[0];
  
  // Create folder structure
  const schemaPath = await createSchemaFolder(schema.slug, schema.type, config.outputDir);
  
  // Combine schema info with version info
  const details: SchemaDetails = {
    id: schema.id,
    slug: schema.slug,
    name: schema.name,
    description: schema.description,
    type: schema.type,
    version: latestVersion.version,
    content: latestVersion.content,
  };
  
  // Write files
  await writeSchemaJson(schemaPath, details, config.targetVersion);
  await writeTokenScriptFiles(schemaPath, details);
  await createUnitTestStub(schemaPath, schema.name, schema.type);
  
  console.log(`✓ Downloaded ${schema.slug} to ${schemaPath}`);
}

/**
 * Download all schemas from the API
 */
export async function downloadAllSchemas(
  config: Partial<SchemaConfig> = {},
): Promise<void> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Fetch schema list
  const schemas = await fetchSchemaList(fullConfig);
  
  // Download each schema
  for (const schema of schemas) {
    try {
      await downloadSchema(schema, fullConfig);
    } catch (error) {
      console.error(`Failed to download ${schema.slug}:`, error);
    }
  }
  
  console.log("\n✓ All schemas downloaded successfully!");
}

export { DEFAULT_CONFIG };
export type * from "@/downloader/types.js";
