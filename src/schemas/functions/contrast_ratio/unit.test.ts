/**
 * Unit tests for the Contrast Ratio function
 * Calculates WCAG 2.1 contrast ratio between two colors
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Contrast Ratio Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "contrast_ratio",
        "function",
      )) as FunctionSpecification;

      expect(schema.name).toBe("Contrast Ratio");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("contrast_ratio");
    });
  });

  describe("Function Execution", () => {
    it("should return 21:1 for black on white", async () => {
      const result = await executeWithSchema(
        "contrast_ratio",
        "function",
        `
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        contrast_ratio(white, black)
        `,
      );

      expect(result).toBeDefined();
      const ratio = (result as any).value ?? result;
      expect(ratio).toBeCloseTo(21, 0);
    });

    it("should return 1:1 for identical colors", async () => {
      const result = await executeWithSchema(
        "contrast_ratio",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.5; c1.g = 0.5; c1.b = 0.5;
        variable c2: Color.SRGB;
        c2.r = 0.5; c2.g = 0.5; c2.b = 0.5;
        contrast_ratio(c1, c2)
        `,
      );

      expect(result).toBeDefined();
      const ratio = (result as any).value ?? result;
      expect(ratio).toBeCloseTo(1, 0);
    });

    it("should be symmetrical (a,b = b,a)", async () => {
      const result1 = await executeWithSchema(
        "contrast_ratio",
        "function",
        `
        variable dark: Color.SRGB;
        dark.r = 0.2; dark.g = 0.2; dark.b = 0.3;
        variable light: Color.SRGB;
        light.r = 0.8; light.g = 0.85; light.b = 0.9;
        contrast_ratio(dark, light)
        `,
      );

      const result2 = await executeWithSchema(
        "contrast_ratio",
        "function",
        `
        variable dark: Color.SRGB;
        dark.r = 0.2; dark.g = 0.2; dark.b = 0.3;
        variable light: Color.SRGB;
        light.r = 0.8; light.g = 0.85; light.b = 0.9;
        contrast_ratio(light, dark)
        `,
      );

      const ratio1 = (result1 as any).value ?? result1;
      const ratio2 = (result2 as any).value ?? result2;
      expect(ratio1).toBeCloseTo(ratio2, 1);
    });
  });
});

