/**
 * Unit tests for the Grayscale function
 * Converts color to grayscale by setting OKLCH chroma to 0
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Grayscale Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("grayscale", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Grayscale");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("grayscale");
    });
  });

  describe("Function Execution", () => {
    it("should convert colored to grayscale", async () => {
      const result = await executeWithSchema(
        "grayscale",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 0.8; red.g = 0.2; red.b = 0.2;
        grayscale(red).to.srgb()
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // All channels should be approximately equal (gray)
      expect(Math.abs(r - g)).toBeLessThan(0.05);
      expect(Math.abs(g - b)).toBeLessThan(0.05);
    });

    it("should preserve lightness", async () => {
      const result = await executeWithSchema(
        "grayscale",
        "function",
        `
        variable bright: Color.SRGB;
        bright.r = 0.9; bright.g = 0.9; bright.b = 0.3;
        grayscale(bright).to.srgb()
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      // Should still be relatively bright
      expect(r).toBeGreaterThan(0.5);
    });

    it("should handle already gray colors", async () => {
      const result = await executeWithSchema(
        "grayscale",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        grayscale(gray).to.srgb()
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      expect(r).toBeCloseTo(0.5, 1);
      expect(g).toBeCloseTo(0.5, 1);
      expect(b).toBeCloseTo(0.5, 1);
    });
  });
});
