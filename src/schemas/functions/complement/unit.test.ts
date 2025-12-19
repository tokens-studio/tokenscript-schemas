/**
 * Unit tests for the Complement function
 * Returns the complementary color (180° hue rotation in OKLCH)
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Complement Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("complement", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Complement");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("complement");
    });
  });

  describe("Function Execution", () => {
    it("should return complementary color (red → cyan)", async () => {
      const result = await executeWithSchema(
        "complement",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 0.9; red.g = 0.2; red.b = 0.2;
        complement(red)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // Complement of red-ish should be cyan-ish (g and b higher than r)
      expect(g).toBeGreaterThan(r);
      expect(b).toBeGreaterThan(r);
    });

    it("should be reversible (complement of complement = original hue)", async () => {
      const result = await executeWithSchema(
        "complement",
        "function",
        `
        variable blue: Color.SRGB;
        blue.r = 0.2; blue.g = 0.3; blue.b = 0.8;
        variable comp: Color.SRGB = complement(blue);
        complement(comp)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const b = (result as any).value.b.value;
      // Should be back to blue-ish
      expect(b).toBeGreaterThan(r);
    });

    it("should preserve lightness", async () => {
      const result = await executeWithSchema(
        "complement",
        "function",
        `
        variable light: Color.SRGB;
        light.r = 0.9; light.g = 0.85; light.b = 0.5;
        complement(light)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // Result should have similar luminance
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      const avgOriginal = (0.9 + 0.85 + 0.5) / 3;
      const avgResult = (r + g + b) / 3;
      expect(Math.abs(avgOriginal - avgResult)).toBeLessThan(0.3);
    });
  });
});
