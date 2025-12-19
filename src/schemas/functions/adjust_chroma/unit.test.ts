/**
 * Unit tests for the adjust_chroma function
 * Adjusts chroma by relative amount
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("adjust_chroma function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "adjust_chroma",
        "function"
      )) as FunctionSpecification;

      expect(schema.name).toBe("adjust_chroma");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should increase chroma with positive value", async () => {
      const result = await executeWithSchema(
        "adjust_chroma",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.5; color.g = 0.4; color.b = 0.4;
        adjust_chroma(color, 0.1)
        `
      );

      expect(result).toBeDefined();
      // More saturated means greater difference between channels
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      expect(r - g).toBeGreaterThan(0.1);
    });

    it("should decrease chroma with negative value", async () => {
      const result = await executeWithSchema(
        "adjust_chroma",
        "function",
        `
        variable orange: Color.SRGB;
        orange.r = 1; orange.g = 0.4; orange.b = 0;
        adjust_chroma(orange, -0.1)
        `
      );

      expect(result).toBeDefined();
      // Result should be less saturated
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      expect(g).toBeGreaterThan(0.4);
    });

    it("should clamp at zero", async () => {
      const result = await executeWithSchema(
        "adjust_chroma",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        adjust_chroma(gray, -1)
        `
      );

      expect(result).toBeDefined();
      // Should remain gray (all channels equal)
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      const b = (result as any).value?.b?.value ?? (result as any).value?.b;
      expect(Math.abs(r - g)).toBeLessThan(0.02);
      expect(Math.abs(g - b)).toBeLessThan(0.02);
    });
  });
});

