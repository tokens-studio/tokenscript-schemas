/**
 * Unit tests for the relative_luminance function
 * Returns WCAG relative luminance
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("relative_luminance function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "relative_luminance",
        "function",
      )) as FunctionSpecification;

      expect(schema.name).toBe("relative_luminance");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should return 1 for white", async () => {
      const result = await executeWithSchema(
        "relative_luminance",
        "function",
        `
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        relative_luminance(white)
        `,
      );

      expect(result).toBeDefined();
      const lum = (result as any).value ?? result;
      expect(lum).toBeCloseTo(1, 2);
    });

    it("should return 0 for black", async () => {
      const result = await executeWithSchema(
        "relative_luminance",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        relative_luminance(black)
        `,
      );

      expect(result).toBeDefined();
      const lum = (result as any).value ?? result;
      expect(lum).toBeCloseTo(0, 2);
    });

    it("should return ~0.2126 for pure red", async () => {
      const result = await executeWithSchema(
        "relative_luminance",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        relative_luminance(red)
        `,
      );

      expect(result).toBeDefined();
      const lum = (result as any).value ?? result;
      expect(lum).toBeCloseTo(0.2126, 2);
    });

    it("should return ~0.7152 for pure green", async () => {
      const result = await executeWithSchema(
        "relative_luminance",
        "function",
        `
        variable green: Color.SRGB;
        green.r = 0; green.g = 1; green.b = 0;
        relative_luminance(green)
        `,
      );

      expect(result).toBeDefined();
      const lum = (result as any).value ?? result;
      expect(lum).toBeCloseTo(0.7152, 2);
    });

    it("should return ~0.0722 for pure blue", async () => {
      const result = await executeWithSchema(
        "relative_luminance",
        "function",
        `
        variable blue: Color.SRGB;
        blue.r = 0; blue.g = 0; blue.b = 1;
        relative_luminance(blue)
        `,
      );

      expect(result).toBeDefined();
      const lum = (result as any).value ?? result;
      expect(lum).toBeCloseTo(0.0722, 2);
    });
  });
});
