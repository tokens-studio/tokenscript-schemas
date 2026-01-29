/**
 * Unit tests for the Mix LCH function
 * Interpolates two colors in CIE LCH space with shortest hue path
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Mix LCH Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("ts_mix_lch", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Mix LCH");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("ts_mix_lch");
    });

    it("should have script defined", async () => {
      const schema = (await getBundledSchema("ts_mix_lch", "function")) as FunctionSpecification;

      expect(schema.script).toBeDefined();
      expect(schema.script.script).toBeTruthy();
      expect(schema.script.script).not.toContain("./");
    });
  });

  describe("Function Execution", () => {
    it("should mix two colors at 50%", async () => {
      const result = await executeWithSchema(
        "ts_mix_lch",
        "function",
        `
        variable c1: Color.LCH;
        c1.l = 40; c1.c = 30; c1.h = 60;
        variable c2: Color.LCH;
        c2.l = 80; c2.c = 50; c2.h = 60;
        ts_mix_lch(c1, c2, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // L: 40 + (80-40)*0.5 = 60
      // C: 30 + (50-30)*0.5 = 40
      const l = (result as any).value.l.value;
      const c = (result as any).value.c.value;
      expect(l).toBeCloseTo(60, 0);
      expect(c).toBeCloseTo(40, 0);
    });

    it("should return first color at 0%", async () => {
      const result = await executeWithSchema(
        "ts_mix_lch",
        "function",
        `
        variable c1: Color.LCH;
        c1.l = 30; c1.c = 20; c1.h = 90;
        variable c2: Color.LCH;
        c2.l = 70; c2.c = 60; c2.h = 270;
        ts_mix_lch(c1, c2, 0)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const l = (result as any).value.l.value;
      expect(l).toBeCloseTo(30, 0);
    });

    it("should return second color at 100%", async () => {
      const result = await executeWithSchema(
        "ts_mix_lch",
        "function",
        `
        variable c1: Color.LCH;
        c1.l = 30; c1.c = 20; c1.h = 90;
        variable c2: Color.LCH;
        c2.l = 70; c2.c = 60; c2.h = 270;
        ts_mix_lch(c1, c2, 1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const l = (result as any).value.l.value;
      expect(l).toBeCloseTo(70, 0);
    });

    it("should default to 50% mix", async () => {
      const result = await executeWithSchema(
        "ts_mix_lch",
        "function",
        `
        variable c1: Color.LCH;
        c1.l = 20; c1.c = 40; c1.h = 0;
        variable c2: Color.LCH;
        c2.l = 80; c2.c = 40; c2.h = 0;
        ts_mix_lch(c1, c2)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // L: 20 + (80-20)*0.5 = 50
      const l = (result as any).value.l.value;
      expect(l).toBeCloseTo(50, 0);
    });

    it("should use shortest hue path", async () => {
      const result = await executeWithSchema(
        "ts_mix_lch",
        "function",
        `
        variable c1: Color.LCH;
        c1.l = 50; c1.c = 40; c1.h = 350;
        variable c2: Color.LCH;
        c2.l = 50; c2.c = 40; c2.h = 10;
        ts_mix_lch(c1, c2, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // Shortest path from 350 to 10 is +20 degrees, midpoint = 0/360
      const h = (result as any).value.h.value;
      // Should be near 0 or 360
      expect(h < 15 || h > 345).toBe(true);
    });

    it("should output in LCH color space", async () => {
      const result = await executeWithSchema(
        "ts_mix_lch",
        "function",
        `
        variable c1: Color.LCH;
        c1.l = 50; c1.c = 30; c1.h = 100;
        variable c2: Color.LCH;
        c2.l = 60; c2.c = 40; c2.h = 200;
        ts_mix_lch(c1, c2, 0.3)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).value.l).toBeDefined();
      expect((result as any).value.c).toBeDefined();
      expect((result as any).value.h).toBeDefined();
    });
  });
});
