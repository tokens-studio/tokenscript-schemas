/**
 * Unit tests for the Mix HSL function
 * Interpolates two colors in HSL space with shortest hue path
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Mix HSL Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("ts_mix_hsl", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Mix HSL");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("ts_mix_hsl");
    });

    it("should have script defined", async () => {
      const schema = (await getBundledSchema("ts_mix_hsl", "function")) as FunctionSpecification;

      expect(schema.script).toBeDefined();
      expect(schema.script.script).toBeTruthy();
      expect(schema.script.script).not.toContain("./");
    });
  });

  describe("Function Execution", () => {
    it("should mix two colors at 50%", async () => {
      const result = await executeWithSchema(
        "ts_mix_hsl",
        "function",
        `
        variable c1: Color.HSL;
        c1.h = 0; c1.s = 1; c1.l = 0.3;
        variable c2: Color.HSL;
        c2.h = 0; c2.s = 1; c2.l = 0.7;
        ts_mix_hsl(c1, c2, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const l = (result as any).value.l.value;
      expect(l).toBeCloseTo(0.5, 1);
    });

    it("should return first color at 0%", async () => {
      const result = await executeWithSchema(
        "ts_mix_hsl",
        "function",
        `
        variable c1: Color.HSL;
        c1.h = 120; c1.s = 0.8; c1.l = 0.4;
        variable c2: Color.HSL;
        c2.h = 240; c2.s = 0.6; c2.l = 0.8;
        ts_mix_hsl(c1, c2, 0)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const l = (result as any).value.l.value;
      const s = (result as any).value.s.value;
      expect(l).toBeCloseTo(0.4, 1);
      expect(s).toBeCloseTo(0.8, 1);
    });

    it("should return second color at 100%", async () => {
      const result = await executeWithSchema(
        "ts_mix_hsl",
        "function",
        `
        variable c1: Color.HSL;
        c1.h = 120; c1.s = 0.8; c1.l = 0.4;
        variable c2: Color.HSL;
        c2.h = 240; c2.s = 0.6; c2.l = 0.8;
        ts_mix_hsl(c1, c2, 1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const l = (result as any).value.l.value;
      const s = (result as any).value.s.value;
      expect(l).toBeCloseTo(0.8, 1);
      expect(s).toBeCloseTo(0.6, 1);
    });

    it("should default to 50% mix", async () => {
      const result = await executeWithSchema(
        "ts_mix_hsl",
        "function",
        `
        variable c1: Color.HSL;
        c1.h = 60; c1.s = 0.5; c1.l = 0.2;
        variable c2: Color.HSL;
        c2.h = 60; c2.s = 0.5; c2.l = 0.8;
        ts_mix_hsl(c1, c2)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const l = (result as any).value.l.value;
      expect(l).toBeCloseTo(0.5, 1);
    });

    it("should use shortest hue path", async () => {
      const result = await executeWithSchema(
        "ts_mix_hsl",
        "function",
        `
        variable c1: Color.HSL;
        c1.h = 350; c1.s = 0.8; c1.l = 0.5;
        variable c2: Color.HSL;
        c2.h = 10; c2.s = 0.8; c2.l = 0.5;
        ts_mix_hsl(c1, c2, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const h = (result as any).value.h.value;
      // Shortest path from 350 to 10 is +20 degrees, midpoint = 0/360
      expect(h < 15 || h > 345).toBe(true);
    });

    it("should output in HSL color space", async () => {
      const result = await executeWithSchema(
        "ts_mix_hsl",
        "function",
        `
        variable c1: Color.HSL;
        c1.h = 100; c1.s = 0.5; c1.l = 0.3;
        variable c2: Color.HSL;
        c2.h = 200; c2.s = 0.7; c2.l = 0.6;
        ts_mix_hsl(c1, c2, 0.3)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).value.h).toBeDefined();
      expect((result as any).value.s).toBeDefined();
      expect((result as any).value.l).toBeDefined();
    });
  });
});
