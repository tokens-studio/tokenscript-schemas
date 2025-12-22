/**
 * Unit tests for the adjust_lightness function
 * Adjusts lightness by relative amount
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("adjust_lightness function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "adjust_lightness",
        "function",
      )) as FunctionSpecification;

      expect(schema.name).toBe("adjust_lightness");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should increase lightness with positive value", async () => {
      const result = await executeWithSchema(
        "adjust_lightness",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.3; gray.g = 0.3; gray.b = 0.3;
        adjust_lightness(gray, 0.3).to.srgb()
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeGreaterThan(0.4);
    });

    it("should decrease lightness with negative value", async () => {
      const result = await executeWithSchema(
        "adjust_lightness",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.7; gray.g = 0.7; gray.b = 0.7;
        adjust_lightness(gray, -0.3).to.srgb()
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeLessThan(0.6);
    });

    it("should clamp to 0 at minimum", async () => {
      const result = await executeWithSchema(
        "adjust_lightness",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.2; gray.g = 0.2; gray.b = 0.2;
        adjust_lightness(gray, -1).to.srgb()
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeCloseTo(0, 1);
    });

    it("should clamp to 1 at maximum", async () => {
      const result = await executeWithSchema(
        "adjust_lightness",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.8; gray.g = 0.8; gray.b = 0.8;
        adjust_lightness(gray, 1).to.srgb()
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeCloseTo(1, 1);
    });
  });
});
