import { unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it, vi } from "vitest";
import { bundleSchemas } from "./bundle.js";

// Mock ulog to silence logs during tests
vi.mock("ulog", () => {
  const mockLogger = () => {};
  mockLogger.error = () => {};
  mockLogger.warn = () => {};
  mockLogger.info = () => {};
  mockLogger.log = () => {};
  mockLogger.debug = () => {};
  mockLogger.trace = () => {};

  return {
    default: () => mockLogger,
  };
});

describe("Bundle Integration Test", () => {
  const testFiles: string[] = [];

  const createTestFile = async (name: string, content: string) => {
    const path = join(process.cwd(), `test-bundle-${name}-${Date.now()}.js`);
    testFiles.push(path);
    await writeFile(path, content, "utf-8");
    return path;
  };

  afterAll(async () => {
    // Clean up all test files
    await Promise.all(
      testFiles.map(async (file) => {
        try {
          await unlink(file);
        } catch {
          // Ignore if file doesn't exist
        }
      }),
    );
  });

  it("should create a valid bundle file that can be loaded and used", async () => {
    // Step 1: Bundle schemas
    const result = await bundleSchemas(["rgb-color", "function:invert"]);

    expect(result.output).toBeTruthy();
    expect(result.metadata.resolvedDependencies).toContain("rgb-color");
    expect(result.metadata.resolvedDependencies).toContain("invert");

    // Step 2: Write and import the bundle
    const testFile = await createTestFile("basic", result.output);
    const fileUrl = `${pathToFileURL(testFile).href}?t=${Date.now()}`;
    const bundle = await import(fileUrl);

    // Step 3: Verify exports exist
    expect(bundle.SCHEMAS).toBeDefined();
    expect(Array.isArray(bundle.SCHEMAS)).toBe(true);
    expect(bundle.makeConfig).toBeDefined();
    expect(typeof bundle.makeConfig).toBe("function");

    // Step 4: Verify SCHEMAS structure
    expect(bundle.SCHEMAS.length).toBeGreaterThan(0);

    const firstSchema = bundle.SCHEMAS[0];
    expect(firstSchema.uri).toBeDefined();
    expect(firstSchema.schema).toBeDefined();
    expect(typeof firstSchema.uri).toBe("string");
    expect(typeof firstSchema.schema).toBe("object");

    // Step 5: Create config using the helper
    const config = bundle.makeConfig();
    expect(config).toBeDefined();

    // Step 6: Verify config has the schemas registered
    // The config should be an instance of Config from @tokens-studio/tokenscript-interpreter
    expect(config.constructor.name).toBe("Config");

    // Step 7: Verify we can find our schemas in the config
    const rgbColorUri = bundle.SCHEMAS.find((s: any) => s.uri.includes("rgb-color"))?.uri;
    const invertUri = bundle.SCHEMAS.find((s: any) => s.uri.includes("/function/invert/"))?.uri;

    expect(rgbColorUri).toBeDefined();
    expect(invertUri).toBeDefined();
  });

  it("should bundle function with dependencies and create working config", async () => {
    // Bundle a function that has dependencies
    const result = await bundleSchemas(["function:adjust_chroma"]);

    expect(result.metadata.resolvedDependencies).toContain("adjust_chroma");
    expect(result.metadata.resolvedDependencies).toContain("srgb-color");
    expect(result.metadata.resolvedDependencies).toContain("oklch-color");

    // Write and import the bundle
    const testFile = await createTestFile("function-deps", result.output);
    const fileUrl = `${pathToFileURL(testFile).href}?t=${Date.now()}`;
    const bundle = await import(fileUrl);

    // Verify key dependencies are in the bundle
    // With includeColorTypeDependencies, this pulls in all conversion dependencies
    expect(bundle.SCHEMAS.length).toBeGreaterThanOrEqual(3);

    const schemaUris = bundle.SCHEMAS.map((s: any) => s.uri);
    expect(schemaUris.some((uri: string) => uri.includes("adjust_chroma"))).toBe(true);
    expect(schemaUris.some((uri: string) => uri.includes("srgb-color"))).toBe(true);
    expect(schemaUris.some((uri: string) => uri.includes("oklch-color"))).toBe(true);

    // Create config and verify it works
    const config = bundle.makeConfig();
    expect(config).toBeDefined();
  });

  it("should handle multiple requested schemas correctly", async () => {
    const result = await bundleSchemas(["rgb-color", "hex-color", "hsl-color"]);

    // Write and import the bundle
    const testFile = await createTestFile("multiple", result.output);
    const fileUrl = `${pathToFileURL(testFile).href}?t=${Date.now()}`;
    const bundle = await import(fileUrl);

    // Should have the requested schemas plus their conversion dependencies
    // With includeColorTypeDependencies, this pulls in all conversion dependencies
    expect(bundle.SCHEMAS.length).toBeGreaterThanOrEqual(3);

    const schemaUris = bundle.SCHEMAS.map((s: any) => s.uri);
    expect(schemaUris.some((uri: string) => uri.includes("rgb-color"))).toBe(true);
    expect(schemaUris.some((uri: string) => uri.includes("hex-color"))).toBe(true);
    expect(schemaUris.some((uri: string) => uri.includes("hsl-color"))).toBe(true);
  });

  it("should generate valid JavaScript with proper imports", async () => {
    const result = await bundleSchemas(["rgb-color"]);

    // Verify the output has the expected structure
    expect(result.output).toContain(
      'import { Config } from "@tokens-studio/tokenscript-interpreter"',
    );
    expect(result.output).toContain("export const SCHEMAS = [");
    expect(result.output).toContain("export function makeConfig()");
    expect(result.output).toContain("return new Config().registerSchemas(SCHEMAS)");
    expect(result.output).toContain("Auto-generated by @tokens-studio/tokenscript-schemas");

    // Write and verify it's valid JavaScript by importing it
    const testFile = await createTestFile("valid-js", result.output);
    const fileUrl = `${pathToFileURL(testFile).href}?t=${Date.now()}`;

    // This will throw if the JavaScript is invalid
    await expect(import(fileUrl)).resolves.toBeDefined();
  });
});
