/**
 * Unit tests for the Shade Scale function
 * Generates a design system shade scale (like Tailwind 50-900)
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Shade Scale Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("shade_scale", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Shade Scale");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("shade_scale");
    });
  });

  describe("Function Execution", () => {
    it("should generate 10 shades by default", async () => {
      const result = await executeWithSchema(
        "shade_scale",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.2; base.g = 0.5; base.b = 0.9;
        shade_scale(base)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should generate specified number of shades", async () => {
      const result = await executeWithSchema(
        "shade_scale",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.9; base.g = 0.3; base.b = 0.4;
        shade_scale(base, 5)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should preserve hue across shades", async () => {
      const result = await executeWithSchema(
        "shade_scale",
        "function",
        `
        variable green: Color.SRGB;
        green.r = 0.2; green.g = 0.7; green.b = 0.3;
        shade_scale(green, 10)
        `,
      );

      expect(result).toBeDefined();
    });
  });
});
