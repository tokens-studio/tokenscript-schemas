/**
 * Unit tests for the adjust_to_contrast function
 * Adjusts a color to meet a target contrast ratio
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("adjust_to_contrast function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "adjust_to_contrast",
        "function"
      )) as FunctionSpecification;

      expect(schema.name).toBe("adjust_to_contrast");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should return unchanged if already meets contrast", async () => {
      const result = await executeWithSchema(
        "adjust_to_contrast",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        adjust_to_contrast(black, white, 4.5).to.srgb()
        `
      );

      expect(result).toBeDefined();
      // Black on white already has 21:1 contrast, should stay black
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeCloseTo(0, 1);
    });

    it("should darken light color on white background", async () => {
      const result = await executeWithSchema(
        "adjust_to_contrast",
        "function",
        `
        variable light_gray: Color.SRGB;
        light_gray.r = 0.8; light_gray.g = 0.8; light_gray.b = 0.8;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        adjust_to_contrast(light_gray, white, 4.5).to.srgb()
        `
      );

      expect(result).toBeDefined();
      // Result should be darker than original
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeLessThan(0.7);
    });

    it("should lighten dark color on black background", async () => {
      const result = await executeWithSchema(
        "adjust_to_contrast",
        "function",
        `
        variable dark_gray: Color.SRGB;
        dark_gray.r = 0.2; dark_gray.g = 0.2; dark_gray.b = 0.2;
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        adjust_to_contrast(dark_gray, black, 4.5).to.srgb()
        `
      );

      expect(result).toBeDefined();
      // Result should be lighter than original
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeGreaterThan(0.3);
    });
  });
});
