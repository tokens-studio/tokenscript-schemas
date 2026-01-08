import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildSchemaDir } from "./build-dir.js";

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

// Mock console.log to capture stdout
const originalConsoleLog = console.log;
let capturedOutput: string[] = [];

function mockConsoleLog(...args: any[]) {
  capturedOutput.push(args.join(" "));
}

describe("Build Command", () => {
  // Test with real existing schemas
  describe("with real schemas", () => {
    it("should build css-color type schema", async () => {
      const cssColorDir = join(process.cwd(), "src/schemas/types/css-color");

      // Capture console output
      capturedOutput = [];
      console.log = mockConsoleLog;

      await buildSchemaDir(cssColorDir);

      // Restore console
      console.log = originalConsoleLog;

      const output = capturedOutput[0];
      const result = JSON.parse(output);

      expect(result.name).toBe("CSS");
      expect(result.type).toBe("color");
      expect(result.initializers).toBeDefined();
      expect(result.conversions).toBeDefined();

      // Verify scripts are inlined
      expect(result.initializers[0].script.script).toContain("variable");
      expect(result.conversions[0].script.script).toContain("variable");
    });

    it("should build darken function schema", async () => {
      const darkenDir = join(process.cwd(), "src/schemas/functions/darken");

      // Capture console output
      capturedOutput = [];
      console.log = mockConsoleLog;

      await buildSchemaDir(darkenDir);

      // Restore console
      console.log = originalConsoleLog;

      const output = capturedOutput[0];
      const result = JSON.parse(output);

      expect(result.name).toBe("Darken");
      expect(result.type).toBe("function");
      expect(result.keyword).toBe("darken");
      expect(result.script).toBeDefined();
      expect(result.requirements).toBeDefined();

      // Verify script is inlined
      expect(result.script.script).toContain("darken");
      expect(result.script.script).toContain("OKLab");
    });
  });

  describe("with custom test schemas", () => {
    const customSchemasDir = join(process.cwd(), "test-build-schemas");
    const customTypeDir = join(customSchemasDir, "custom-color");
    const customFunctionDir = join(customSchemasDir, "custom-function");

    beforeAll(async () => {
      // Create custom color type schema
      await mkdir(customTypeDir, { recursive: true });

      const colorSchemaJson = {
        name: "TestColor",
        type: "color" as const,
        description: "A test color type",
        slug: "test-color",
        schema: {
          type: "object" as const,
          properties: {
            value: { type: "string" as const },
          },
          required: ["value"],
        },
        initializers: [
          {
            title: "Test Initializer",
            keyword: "testcolor",
            description: "Creates a test color",
            script: {
              type: "https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/core/tokenscript/0/",
              script: "./test-initializer.tokenscript",
            },
          },
        ],
        conversions: [
          {
            source: "$self",
            target: "$self",
            description: "Test conversion",
            lossless: true,
            script: {
              type: "https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/core/tokenscript/0/",
              script: "./test-conversion.tokenscript",
            },
          },
        ],
      };

      await writeFile(join(customTypeDir, "schema.json"), JSON.stringify(colorSchemaJson, null, 2));

      const initializerScript = `// Test initializer
variable input: List = {input};
variable value: String = input.get(0);
variable output: Color.TestColor;
output.value = value;
return output;`;

      await writeFile(join(customTypeDir, "test-initializer.tokenscript"), initializerScript);

      const conversionScript = `// Test conversion
variable input: Color.TestColor = {input};
variable output: Color.TestColor;
output.value = input.value;
return output;`;

      await writeFile(join(customTypeDir, "test-conversion.tokenscript"), conversionScript);

      // Create custom function schema
      await mkdir(customFunctionDir, { recursive: true });

      const functionSchemaJson = {
        name: "TestFunction",
        type: "function" as const,
        description: "A test function",
        keyword: "testfunc",
        input: {
          type: "object" as const,
          properties: {
            value: { type: "number" as const },
          },
        },
        script: {
          type: "https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/core/tokenscript/0/",
          script: "./test-function.tokenscript",
        },
        requirements: [] as string[],
      };

      await writeFile(
        join(customFunctionDir, "schema.json"),
        JSON.stringify(functionSchemaJson, null, 2),
      );

      const functionScript = `// Test function
variable input: List = {input};
variable value: Number = input.get(0);
return value * 2;`;

      await writeFile(join(customFunctionDir, "test-function.tokenscript"), functionScript);
    });

    afterAll(async () => {
      // Clean up
      try {
        await rm(customSchemasDir, { recursive: true, force: true });
      } catch {
        // Ignore
      }
    });

    it("should build color type schema with inlined scripts", async () => {
      capturedOutput = [];
      console.log = mockConsoleLog;

      await buildSchemaDir(customTypeDir);

      console.log = originalConsoleLog;

      const output = capturedOutput[0];
      const result = JSON.parse(output);

      expect(result.name).toBe("TestColor");
      expect(result.type).toBe("color");
      expect(result.initializers[0].script.script).toContain("variable input: List");
      expect(result.conversions[0].script.script).toContain("variable input: Color.TestColor");
    });

    it("should build function schema with inlined script", async () => {
      capturedOutput = [];
      console.log = mockConsoleLog;

      await buildSchemaDir(customFunctionDir);

      console.log = originalConsoleLog;

      const output = capturedOutput[0];
      const result = JSON.parse(output);

      expect(result.name).toBe("TestFunction");
      expect(result.type).toBe("function");
      expect(result.script.script).toContain("variable input: List");
      expect(result.script.script).toContain("return value * 2");
    });

    it("should output pretty JSON with --pretty option", async () => {
      capturedOutput = [];
      console.log = mockConsoleLog;

      await buildSchemaDir(customTypeDir, { pretty: true });

      console.log = originalConsoleLog;

      const output = capturedOutput[0];

      // Pretty JSON should have newlines and indentation
      expect(output).toContain("\n");
      expect(output).toContain("  ");
    });

    it("should output compact JSON without --pretty option", async () => {
      capturedOutput = [];
      console.log = mockConsoleLog;

      await buildSchemaDir(customTypeDir, { pretty: false });

      console.log = originalConsoleLog;

      const output = capturedOutput[0];

      // Compact JSON should not have newlines (except maybe trailing)
      const lineCount = output.split("\n").length;
      expect(lineCount).toBeLessThan(5);
    });

    it("should write to file when --output is specified", async () => {
      const outputFile = join(customSchemasDir, "output.json");

      await buildSchemaDir(customTypeDir, { output: outputFile });

      expect(existsSync(outputFile)).toBe(true);

      const content = await readFile(outputFile, "utf-8");
      const result = JSON.parse(content);

      expect(result.name).toBe("TestColor");
    });

    it("should write pretty JSON to file with --pretty and --output", async () => {
      const outputFile = join(customSchemasDir, "output-pretty.json");

      await buildSchemaDir(customTypeDir, { output: outputFile, pretty: true });

      const content = await readFile(outputFile, "utf-8");

      // Pretty JSON should have newlines and indentation
      expect(content).toContain("\n");
      expect(content).toContain("  ");
    });
  });

  describe("error handling", () => {
    it("should throw error for non-existent directory", async () => {
      await expect(buildSchemaDir("/non-existent/directory")).rejects.toThrow(
        /Directory not found|not found/,
      );
    });

    it("should throw error for directory without schema.json", async () => {
      const emptyDir = join(process.cwd(), "test-empty-dir");

      await mkdir(emptyDir, { recursive: true });

      try {
        await expect(buildSchemaDir(emptyDir)).rejects.toThrow(/schema.json not found/);
      } finally {
        await rm(emptyDir, { recursive: true, force: true });
      }
    });
  });

  describe("path resolution", () => {
    const testSchemasDir = join(process.cwd(), "test-path-schemas");
    const testSchemaDir = join(testSchemasDir, "test-schema");

    beforeAll(async () => {
      await mkdir(testSchemaDir, { recursive: true });

      const schemaJson = {
        name: "PathTest",
        type: "color" as const,
        description: "Path test schema",
        slug: "path-test",
        schema: {
          type: "object" as const,
          properties: {
            value: { type: "string" as const },
          },
          required: ["value"],
        },
        initializers: [] as any[],
        conversions: [] as any[],
      };

      await writeFile(join(testSchemaDir, "schema.json"), JSON.stringify(schemaJson, null, 2));
    });

    afterAll(async () => {
      try {
        await rm(testSchemasDir, { recursive: true, force: true });
      } catch {
        // Ignore
      }
    });

    it("should resolve relative paths from current working directory", async () => {
      // Use a relative path
      const relativePath = "test-path-schemas/test-schema";

      capturedOutput = [];
      console.log = mockConsoleLog;

      await buildSchemaDir(relativePath);

      console.log = originalConsoleLog;

      const output = capturedOutput[0];
      const result = JSON.parse(output);

      expect(result.name).toBe("PathTest");
    });
  });
});
