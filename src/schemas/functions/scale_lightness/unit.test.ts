/**
 * Unit tests for the scale_lightness function
 * Scales a color's lightness by a factor
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("scale_lightness function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "scale_lightness",
        "function"
      )) as FunctionSpecification;

      expect(schema.name).toBe("scale_lightness");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should increase lightness with factor > 1", async () => {
      const result = await executeWithSchema(
        "scale_lightness",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        scale_lightness(gray, 1.2)
        `
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeGreaterThan(0.5);
    });

    it("should decrease lightness with factor < 1", async () => {
      const result = await executeWithSchema(
        "scale_lightness",
        "function",
        `
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        scale_lightness(white, 0.5)
        `
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeLessThan(0.9);
      expect(r).toBeGreaterThan(0.3);
    });

    it("should clamp to 0 with factor 0", async () => {
      const result = await executeWithSchema(
        "scale_lightness",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        scale_lightness(gray, 0)
        `
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeCloseTo(0, 1);
    });
  });
});
