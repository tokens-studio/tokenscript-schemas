/**
 * Unit tests for the Darken HSL function
 * Decreases lightness in HSL color space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Darken HSL Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("ts_darken_hsl", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Darken HSL");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("ts_darken_hsl");
    });

    it("should have script defined", async () => {
      const schema = (await getBundledSchema("ts_darken_hsl", "function")) as FunctionSpecification;

      expect(schema.script).toBeDefined();
      expect(schema.script.script).toBeTruthy();
      expect(schema.script.script).not.toContain("./");
    });
  });

  describe("Function Execution", () => {
    it("should darken a color in HSL space", async () => {
      const result = await executeWithSchema(
        "ts_darken_hsl",
        "function",
        `
        variable color: Color.HSL;
        color.h = 200; color.s = 0.8; color.l = 0.6;
        ts_darken_hsl(color, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // l: 0.6 * (1 - 0.5) = 0.3
      const l = (result as any).value.l.value;
      expect(l).toBeCloseTo(0.3, 1);
    });

    it("should use default amount of 0.25", async () => {
      const result = await executeWithSchema(
        "ts_darken_hsl",
        "function",
        `
        variable color: Color.HSL;
        color.h = 120; color.s = 0.6; color.l = 0.8;
        ts_darken_hsl(color)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // l: 0.8 * (1 - 0.25) = 0.6
      const l = (result as any).value.l.value;
      expect(l).toBeCloseTo(0.6, 1);
    });

    it("should not go below l=0", async () => {
      const result = await executeWithSchema(
        "ts_darken_hsl",
        "function",
        `
        variable color: Color.HSL;
        color.h = 0; color.s = 0.5; color.l = 0.05;
        ts_darken_hsl(color, 0.99)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const l = (result as any).value.l.value;
      expect(l).toBeGreaterThanOrEqual(0);
    });

    it("should preserve hue and saturation", async () => {
      const result = await executeWithSchema(
        "ts_darken_hsl",
        "function",
        `
        variable color: Color.HSL;
        color.h = 240; color.s = 0.7; color.l = 0.5;
        ts_darken_hsl(color, 0.2)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const h = (result as any).value.h.value;
      const s = (result as any).value.s.value;
      expect(h).toBeCloseTo(240, 1);
      expect(s).toBeCloseTo(0.7, 1);
    });

    it("should output in HSL color space", async () => {
      const result = await executeWithSchema(
        "ts_darken_hsl",
        "function",
        `
        variable color: Color.HSL;
        color.h = 60; color.s = 0.5; color.l = 0.6;
        ts_darken_hsl(color, 0.1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).value.h).toBeDefined();
      expect((result as any).value.s).toBeDefined();
      expect((result as any).value.l).toBeDefined();
    });
  });
});
