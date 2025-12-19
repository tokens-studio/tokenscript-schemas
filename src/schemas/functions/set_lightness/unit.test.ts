/**
 * Unit tests for the Set Lightness function
 * Sets a color's lightness to a specific value in OKLCH
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Set Lightness Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("set_lightness", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Set Lightness");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("set_lightness");
    });
  });

  describe("Function Execution", () => {
    it("should set lightness to 0 (black)", async () => {
      const result = await executeWithSchema(
        "set_lightness",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.8; color.g = 0.3; color.b = 0.5;
        set_lightness(color, 0)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // Should be very dark
      expect(r + g + b).toBeLessThan(0.1);
    });

    it("should set lightness to 1 (white)", async () => {
      const result = await executeWithSchema(
        "set_lightness",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.2; color.g = 0.5; color.b = 0.3;
        set_lightness(color, 1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // Should be very bright
      expect(r + g + b).toBeGreaterThan(2.5);
    });

    it("should preserve hue", async () => {
      const result = await executeWithSchema(
        "set_lightness",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 0.9; red.g = 0.1; red.b = 0.1;
        set_lightness(red, 0.7)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // Should still be red-ish
      expect(r).toBeGreaterThan(g);
      expect(r).toBeGreaterThan(b);
    });
  });
});
