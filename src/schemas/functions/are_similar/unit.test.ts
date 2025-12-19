/**
 * Unit tests for the are_similar function
 * Checks if two colors are perceptually similar
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("are_similar function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "are_similar",
        "function"
      )) as FunctionSpecification;

      expect(schema.name).toBe("are_similar");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should return true for identical colors", async () => {
      const result = await executeWithSchema(
        "are_similar",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.5; c1.g = 0.5; c1.b = 0.5;
        variable c2: Color.SRGB;
        c2.r = 0.5; c2.g = 0.5; c2.b = 0.5;
        are_similar(c1, c2)
        `
      );

      expect(result).toBeDefined();
      const similar = (result as any).value ?? result;
      expect(similar).toBe(true);
    });

    it("should return false for obviously different colors", async () => {
      const result = await executeWithSchema(
        "are_similar",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        variable green: Color.SRGB;
        green.r = 0; green.g = 1; green.b = 0;
        are_similar(red, green)
        `
      );

      expect(result).toBeDefined();
      const similar = (result as any).value ?? result;
      expect(similar).toBe(false);
    });
  });
});
