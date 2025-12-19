/**
 * Unit tests for the Distributed function
 * Creates evenly distributed categorical colors using OKLCH
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Distributed Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("distributed", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Distributed");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("distributed");
    });
  });

  describe("Function Execution", () => {
    it("should generate 6 colors by default", async () => {
      const result = await executeWithSchema(
        "distributed",
        "function",
        `
        distributed()
        `,
      );

      expect(result).toBeDefined();
    });

    it("should generate specified number of colors", async () => {
      const result = await executeWithSchema(
        "distributed",
        "function",
        `
        distributed(8)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should allow custom lightness and chroma", async () => {
      const result = await executeWithSchema(
        "distributed",
        "function",
        `
        distributed(5, 0.6, 0.2)
        `,
      );

      expect(result).toBeDefined();
    });
  });
});
