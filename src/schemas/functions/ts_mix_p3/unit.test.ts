/**
 * Unit tests for the Mix P3 function
 * Interpolates two colors linearly in Display P3 space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Mix P3 Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("ts_mix_p3", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Mix P3");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("ts_mix_p3");
    });

    it("should have script defined", async () => {
      const schema = (await getBundledSchema("ts_mix_p3", "function")) as FunctionSpecification;

      expect(schema.script).toBeDefined();
      expect(schema.script.script).toBeTruthy();
      expect(schema.script.script).not.toContain("./");
    });
  });

  describe("Function Execution", () => {
    it("should mix two colors at 50%", async () => {
      const result = await executeWithSchema(
        "ts_mix_p3",
        "function",
        `
        variable c1: Color.P3;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.P3;
        c2.r = 0; c2.g = 0; c2.b = 1;
        ts_mix_p3(c1, c2, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const b = (result as any).value.b.value;
      expect(r).toBeCloseTo(0.5, 1);
      expect(b).toBeCloseTo(0.5, 1);
    });

    it("should return first color at 0%", async () => {
      const result = await executeWithSchema(
        "ts_mix_p3",
        "function",
        `
        variable c1: Color.P3;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.P3;
        c2.r = 0; c2.g = 1; c2.b = 0;
        ts_mix_p3(c1, c2, 0)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      expect(r).toBeCloseTo(1, 1);
    });

    it("should return second color at 100%", async () => {
      const result = await executeWithSchema(
        "ts_mix_p3",
        "function",
        `
        variable c1: Color.P3;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.P3;
        c2.r = 0; c2.g = 1; c2.b = 0;
        ts_mix_p3(c1, c2, 1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const g = (result as any).value.g.value;
      expect(g).toBeCloseTo(1, 1);
    });

    it("should default to 50% mix", async () => {
      const result = await executeWithSchema(
        "ts_mix_p3",
        "function",
        `
        variable c1: Color.P3;
        c1.r = 0; c1.g = 0; c1.b = 0;
        variable c2: Color.P3;
        c2.r = 1; c2.g = 1; c2.b = 1;
        ts_mix_p3(c1, c2)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      expect(r).toBeCloseTo(0.5, 1);
    });

    it("should output in P3 color space", async () => {
      const result = await executeWithSchema(
        "ts_mix_p3",
        "function",
        `
        variable c1: Color.P3;
        c1.r = 0.2; c1.g = 0.3; c1.b = 0.4;
        variable c2: Color.P3;
        c2.r = 0.8; c2.g = 0.7; c2.b = 0.6;
        ts_mix_p3(c1, c2, 0.3)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).value.r).toBeDefined();
      expect((result as any).value.g).toBeDefined();
      expect((result as any).value.b).toBeDefined();
    });
  });
});
