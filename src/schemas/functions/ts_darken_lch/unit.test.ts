/**
 * Unit tests for the Darken LCH function
 * Decreases lightness in CIE LCH color space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Darken LCH Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("ts_darken_lch", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Darken LCH");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("ts_darken_lch");
    });

    it("should have script defined", async () => {
      const schema = (await getBundledSchema("ts_darken_lch", "function")) as FunctionSpecification;

      expect(schema.script).toBeDefined();
      expect(schema.script.script).toBeTruthy();
      expect(schema.script.script).not.toContain("./");
    });
  });

  describe("Function Execution", () => {
    it("should darken a light color in LCH space", async () => {
      const result = await executeWithSchema(
        "ts_darken_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 80; color.c = 50; color.h = 270;
        ts_darken_lch(color, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // L: 80 * (1 - 0.5) = 40
      const l = (result as any).value.l.value;
      expect(l).toBeCloseTo(40, 0);
    });

    it("should use default amount of 0.25", async () => {
      const result = await executeWithSchema(
        "ts_darken_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 60; color.c = 30; color.h = 180;
        ts_darken_lch(color)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // L: 60 * (1 - 0.25) = 45
      const l = (result as any).value.l.value;
      expect(l).toBeCloseTo(45, 0);
    });

    it("should not go below L=0", async () => {
      const result = await executeWithSchema(
        "ts_darken_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 5; color.c = 10; color.h = 90;
        ts_darken_lch(color, 0.99)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const l = (result as any).value.l.value;
      expect(l).toBeGreaterThanOrEqual(0);
    });

    it("should preserve chroma and hue", async () => {
      const result = await executeWithSchema(
        "ts_darken_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 70; color.c = 40; color.h = 120;
        ts_darken_lch(color, 0.2)
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
        "ts_darken_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 50; color.c = 30; color.h = 200;
        ts_darken_lch(color, 0.1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).value.l).toBeDefined();
      expect((result as any).value.c).toBeDefined();
      expect((result as any).value.h).toBeDefined();
    });
  });
});
