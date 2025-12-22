/**
 * Unit tests for the neutral_variant function
 * Creates a gray version of a color preserving lightness
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("neutral_variant function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "neutral_variant",
        "function",
      )) as FunctionSpecification;

      expect(schema.name).toBe("neutral_variant");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should produce pure gray with default retention", async () => {
      const result = await executeWithSchema(
        "neutral_variant",
        "function",
        `
        variable blue: Color.SRGB;
        blue.r = 0; blue.g = 0.4; blue.b = 0.8;
        neutral_variant(blue).to.srgb()
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      const b = (result as any).value?.b?.value ?? (result as any).value?.b;
      // Should be gray
      expect(Math.abs(r - g)).toBeLessThan(0.05);
      expect(Math.abs(g - b)).toBeLessThan(0.05);
    });

    it("should retain some color with retention > 0", async () => {
      const result = await executeWithSchema(
        "neutral_variant",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        neutral_variant(red, 0.5).to.srgb()
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      // Should still have some red tint
      expect(r).toBeGreaterThan(g);
    });

    it("should handle white (already neutral)", async () => {
      const result = await executeWithSchema(
        "neutral_variant",
        "function",
        `
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        neutral_variant(white).to.srgb()
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

    it("should handle black (already neutral)", async () => {
      const result = await executeWithSchema(
        "neutral_variant",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        neutral_variant(black).to.srgb()
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
  });
});
