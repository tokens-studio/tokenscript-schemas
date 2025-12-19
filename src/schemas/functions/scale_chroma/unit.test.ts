/**
 * Unit tests for the scale_chroma function
 * Scales a color's chroma by a factor
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("scale_chroma function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "scale_chroma",
        "function"
      )) as FunctionSpecification;

      expect(schema.name).toBe("scale_chroma");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should decrease saturation with factor < 1", async () => {
      const result = await executeWithSchema(
        "scale_chroma",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        scale_chroma(red, 0.5)
        `
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      // Desaturated red should have less extreme difference
      expect(Math.abs(r - g)).toBeLessThan(0.8);
    });

    it("should produce gray with factor 0", async () => {
      const result = await executeWithSchema(
        "scale_chroma",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        scale_chroma(red, 0)
        `
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      const b = (result as any).value?.b?.value ?? (result as any).value?.b;
      // Should be gray
      expect(Math.abs(r - g)).toBeLessThan(0.05);
      expect(Math.abs(g - b)).toBeLessThan(0.05);
    });

    it("should handle already gray colors", async () => {
      const result = await executeWithSchema(
        "scale_chroma",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        scale_chroma(gray, 2)
        `
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      const b = (result as any).value?.b?.value ?? (result as any).value?.b;
      // Gray scaled stays gray (0 * 2 = 0)
      expect(Math.abs(r - g)).toBeLessThan(0.05);
      expect(Math.abs(g - b)).toBeLessThan(0.05);
    });
  });
});
