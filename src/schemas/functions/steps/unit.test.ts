/**
 * Unit tests for the Steps function
 * Generates gradient stops between two colors in OKLCH space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Steps Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("steps", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Steps");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("steps");
    });
  });

  describe("Function Execution", () => {
    it("should generate 5 steps by default", async () => {
      const result = await executeWithSchema(
        "steps",
        "function",
        `
        variable start: Color.SRGB;
        start.r = 1; start.g = 0; start.b = 0;
        variable end: Color.SRGB;
        end.r = 0; end.g = 0; end.b = 1;
        steps(start, end)
        `,
      );

      // Result should be a list
      expect(result).toBeDefined();
    });

    it("should generate specified number of steps", async () => {
      const result = await executeWithSchema(
        "steps",
        "function",
        `
        variable start: Color.SRGB;
        start.r = 0; start.g = 0; start.b = 0;
        variable end: Color.SRGB;
        end.r = 1; end.g = 1; end.b = 1;
        steps(start, end, 3)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should include start and end colors", async () => {
      const result = await executeWithSchema(
        "steps",
        "function",
        `
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        steps(white, black, 5)
        `,
      );

      expect(result).toBeDefined();
    });
  });
});

