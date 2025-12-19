/**
 * Unit tests for the Luminance function
 * Returns relative luminance (0-1) of a color
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Luminance Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("luminance", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Luminance");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("luminance");
    });
  });

  describe("Function Execution", () => {
    it("should return 1 for white", async () => {
      const result = await executeWithSchema(
        "luminance",
        "function",
        `
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        luminance(white)
        `,
      );

      expect(result).toBeDefined();
      const lum = (result as any).value ?? result;
      expect(lum).toBeCloseTo(1, 1);
    });

    it("should return 0 for black", async () => {
      const result = await executeWithSchema(
        "luminance",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        luminance(black)
        `,
      );

      expect(result).toBeDefined();
      const lum = (result as any).value ?? result;
      expect(lum).toBeCloseTo(0, 1);
    });

    it("should return ~0.21 for pure red", async () => {
      const result = await executeWithSchema(
        "luminance",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        luminance(red)
        `,
      );

      expect(result).toBeDefined();
      const lum = (result as any).value ?? result;
      // Red luminance coefficient is ~0.2126
      expect(lum).toBeCloseTo(0.21, 1);
    });

    it("should return ~0.72 for pure green", async () => {
      const result = await executeWithSchema(
        "luminance",
        "function",
        `
        variable green: Color.SRGB;
        green.r = 0; green.g = 1; green.b = 0;
        luminance(green)
        `,
      );

      expect(result).toBeDefined();
      const lum = (result as any).value ?? result;
      // Green luminance coefficient is ~0.7152
      expect(lum).toBeCloseTo(0.72, 1);
    });

    it("should return ~0.07 for pure blue", async () => {
      const result = await executeWithSchema(
        "luminance",
        "function",
        `
        variable blue: Color.SRGB;
        blue.r = 0; blue.g = 0; blue.b = 1;
        luminance(blue)
        `,
      );

      expect(result).toBeDefined();
      const lum = (result as any).value ?? result;
      // Blue luminance coefficient is ~0.0722
      expect(lum).toBeCloseTo(0.07, 1);
    });
  });
});

