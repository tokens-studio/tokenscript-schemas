/**
 * Unit tests for the Lighten LCH function
 * Increases lightness in CIE LCH color space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Lighten LCH Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "ts_lighten_lch",
        "function",
      )) as FunctionSpecification;

      expect(schema.name).toBe("Lighten LCH");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("ts_lighten_lch");
    });

    it("should have script defined", async () => {
      const schema = (await getBundledSchema(
        "ts_lighten_lch",
        "function",
      )) as FunctionSpecification;

      expect(schema.script).toBeDefined();
      expect(schema.script.script).toBeTruthy();
      expect(schema.script.script).not.toContain("./");
    });
  });

  describe("Function Execution", () => {
    it("should lighten a dark color in LCH space", async () => {
      const result = await executeWithSchema(
        "ts_lighten_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 30; color.c = 50; color.h = 270;
        ts_lighten_lch(color, 0.3)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // L should increase: 30 + (100 - 30) * 0.3 = 51
      const l = (result as any).value.l.value;
      expect(l).toBeCloseTo(51, 0);
    });

    it("should use default amount of 0.25", async () => {
      const result = await executeWithSchema(
        "ts_lighten_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 40; color.c = 30; color.h = 180;
        ts_lighten_lch(color)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // L should increase: 40 + (100 - 40) * 0.25 = 55
      const l = (result as any).value.l.value;
      expect(l).toBeCloseTo(55, 0);
    });

    it("should not exceed L=100", async () => {
      const result = await executeWithSchema(
        "ts_lighten_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 95; color.c = 10; color.h = 90;
        ts_lighten_lch(color, 0.9)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const l = (result as any).value.l.value;
      expect(l).toBeLessThanOrEqual(100);
    });

    it("should preserve chroma and hue", async () => {
      const result = await executeWithSchema(
        "ts_lighten_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 50; color.c = 40; color.h = 120;
        ts_lighten_lch(color, 0.2)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const c = (result as any).value.c.value;
      const h = (result as any).value.h.value;
      expect(c).toBeCloseTo(40, 1);
      expect(h).toBeCloseTo(120, 1);
    });

    it("should output in LCH color space", async () => {
      const result = await executeWithSchema(
        "ts_lighten_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 50; color.c = 30; color.h = 200;
        ts_lighten_lch(color, 0.1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // Verify LCH channels exist
      expect((result as any).value.l).toBeDefined();
      expect((result as any).value.c).toBeDefined();
      expect((result as any).value.h).toBeDefined();
    });
  });
});
