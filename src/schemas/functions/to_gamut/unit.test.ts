/**
 * Unit tests for the to_gamut function
 * Maps colors into sRGB gamut
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("to_gamut function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("to_gamut", "function")) as FunctionSpecification;

      expect(schema.name).toBe("to_gamut");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should return in-gamut color unchanged", async () => {
      const result = await executeWithSchema(
        "to_gamut",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        to_gamut(red)
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeCloseTo(1, 1);
    });

    it("should handle white", async () => {
      const result = await executeWithSchema(
        "to_gamut",
        "function",
        `
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        to_gamut(white)
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      const b = (result as any).value?.b?.value ?? (result as any).value?.b;
      expect(r).toBeCloseTo(1, 1);
      expect(g).toBeCloseTo(1, 1);
      expect(b).toBeCloseTo(1, 1);
    });

    it("should handle black", async () => {
      const result = await executeWithSchema(
        "to_gamut",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        to_gamut(black)
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      const b = (result as any).value?.b?.value ?? (result as any).value?.b;
      expect(r).toBeCloseTo(0, 1);
      expect(g).toBeCloseTo(0, 1);
      expect(b).toBeCloseTo(0, 1);
    });

    it("should handle grayscale colors", async () => {
      const result = await executeWithSchema(
        "to_gamut",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        to_gamut(gray)
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      const b = (result as any).value?.b?.value ?? (result as any).value?.b;
      // Gray should remain gray
      expect(Math.abs(r - g)).toBeLessThan(0.05);
      expect(Math.abs(g - b)).toBeLessThan(0.05);
    });
  });
});
