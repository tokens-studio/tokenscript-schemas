/**
 * Unit tests for the clamp_lightness function
 * Constrains lightness to a range
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("clamp_lightness function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "clamp_lightness",
        "function"
      )) as FunctionSpecification;

      expect(schema.name).toBe("clamp_lightness");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should clamp dark color to minimum", async () => {
      const result = await executeWithSchema(
        "clamp_lightness",
        "function",
        `
        variable dark: Color.SRGB;
        dark.r = 0.1; dark.g = 0.1; dark.b = 0.1;
        clamp_lightness(dark, 0.5, 0.9).to.srgb()
        `
      );

      expect(result).toBeDefined();
      // Result should be brighter than input
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeGreaterThan(0.3);
    });

    it("should clamp light color to maximum", async () => {
      const result = await executeWithSchema(
        "clamp_lightness",
        "function",
        `
        variable light: Color.SRGB;
        light.r = 1; light.g = 1; light.b = 1;
        clamp_lightness(light, 0.1, 0.5).to.srgb()
        `
      );

      expect(result).toBeDefined();
      // Result should be darker than input
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeLessThan(0.8);
    });

    it("should not change color within range", async () => {
      const result = await executeWithSchema(
        "clamp_lightness",
        "function",
        `
        variable mid: Color.SRGB;
        mid.r = 0.5; mid.g = 0.5; mid.b = 0.5;
        clamp_lightness(mid, 0.1, 0.9).to.srgb()
        `
      );

      expect(result).toBeDefined();
      // Mid-gray should remain mid-gray
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeGreaterThan(0.3);
      expect(r).toBeLessThan(0.7);
    });
  });
});

