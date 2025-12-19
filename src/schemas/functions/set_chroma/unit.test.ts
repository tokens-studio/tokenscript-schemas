/**
 * Unit tests for the Set Chroma function
 * Sets a color's chroma (saturation) to a specific value in OKLCH
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Set Chroma Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("set_chroma", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Set Chroma");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("set_chroma");
    });
  });

  describe("Function Execution", () => {
    it("should set chroma to 0 (grayscale)", async () => {
      const result = await executeWithSchema(
        "set_chroma",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 0.9; red.g = 0.2; red.b = 0.2;
        set_chroma(red, 0)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // Should be gray (all channels similar)
      expect(Math.abs(r - g)).toBeLessThan(0.1);
      expect(Math.abs(g - b)).toBeLessThan(0.1);
    });

    it("should increase chroma for muted color", async () => {
      const result = await executeWithSchema(
        "set_chroma",
        "function",
        `
        variable muted: Color.SRGB;
        muted.r = 0.5; muted.g = 0.45; muted.b = 0.48;
        set_chroma(muted, 0.15)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      // Should be more saturated (more spread between channels)
      expect(Math.abs(r - g)).toBeGreaterThan(0);
    });

    it("should preserve lightness", async () => {
      const result = await executeWithSchema(
        "set_chroma",
        "function",
        `
        variable bright: Color.SRGB;
        bright.r = 0.9; bright.g = 0.85; bright.b = 0.5;
        set_chroma(bright, 0.1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // Should still be relatively bright
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      expect((r + g + b) / 3).toBeGreaterThan(0.5);
    });
  });
});
