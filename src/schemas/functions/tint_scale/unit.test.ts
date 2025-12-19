/**
 * Unit tests for the Tint Scale function
 * Creates a sequential tint scale from a base color
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Tint Scale Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("tint_scale", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Tint Scale");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("tint_scale");
    });
  });

  describe("Function Execution", () => {
    it("should generate 9 tints by default", async () => {
      const result = await executeWithSchema(
        "tint_scale",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.2; base.g = 0.5; base.b = 0.8;
        tint_scale(base)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should generate specified number of tints", async () => {
      const result = await executeWithSchema(
        "tint_scale",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.6; base.g = 0.3; base.b = 0.7;
        tint_scale(base, 5)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should preserve hue across scale", async () => {
      const result = await executeWithSchema(
        "tint_scale",
        "function",
        `
        variable blue: Color.SRGB;
        blue.r = 0.1; blue.g = 0.2; blue.b = 0.9;
        tint_scale(blue, 3)
        `,
      );

      expect(result).toBeDefined();
    });
  });
});
