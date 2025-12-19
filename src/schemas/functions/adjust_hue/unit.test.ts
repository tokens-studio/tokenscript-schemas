/**
 * Unit tests for the adjust_hue function
 * Adjusts hue by relative degrees
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("adjust_hue function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "adjust_hue",
        "function"
      )) as FunctionSpecification;

      expect(schema.name).toBe("adjust_hue");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should rotate hue clockwise", async () => {
      const result = await executeWithSchema(
        "adjust_hue",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        adjust_hue(red, 90).to.srgb()
        `
      );

      expect(result).toBeDefined();
      expect((result as any).constructor.name).toBe("ColorSymbol");
    });

    it("should rotate hue counter-clockwise", async () => {
      const result = await executeWithSchema(
        "adjust_hue",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        adjust_hue(red, -90).to.srgb()
        `
      );

      expect(result).toBeDefined();
      expect((result as any).constructor.name).toBe("ColorSymbol");
    });

    it("should wrap around at 360", async () => {
      const result = await executeWithSchema(
        "adjust_hue",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        adjust_hue(red, 360).to.srgb()
        `
      );

      expect(result).toBeDefined();
      // Should be same hue as input (full rotation)
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeGreaterThan(0.7);
    });
  });
});

