/**
 * Unit tests for the interpolate function
 * Interpolates between colors in perceptual space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("interpolate function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "interpolate",
        "function"
      )) as FunctionSpecification;

      expect(schema.name).toBe("interpolate");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should return start color at t=0", async () => {
      const result = await executeWithSchema(
        "interpolate",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        interpolate(black, white, 0)
        `
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeCloseTo(0, 1);
    });

    it("should return end color at t=1", async () => {
      const result = await executeWithSchema(
        "interpolate",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        interpolate(black, white, 1)
        `
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeCloseTo(1, 1);
    });

    it("should return midpoint at t=0.5", async () => {
      const result = await executeWithSchema(
        "interpolate",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        interpolate(black, white, 0.5)
        `
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      // Should be medium gray
      expect(r).toBeGreaterThan(0.3);
      expect(r).toBeLessThan(0.7);
    });

    it("should use default t=0.5", async () => {
      const result = await executeWithSchema(
        "interpolate",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        interpolate(black, white)
        `
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeGreaterThan(0.3);
      expect(r).toBeLessThan(0.7);
    });
  });
});

