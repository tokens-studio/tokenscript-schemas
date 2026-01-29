/**
 * Unit tests for the Lighten P3 function
 * Increases lightness by interpolating each channel toward white in Display P3 space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Lighten P3 Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("ts_lighten_p3", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Lighten P3");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("ts_lighten_p3");
    });

    it("should have script defined", async () => {
      const schema = (await getBundledSchema("ts_lighten_p3", "function")) as FunctionSpecification;

      expect(schema.script).toBeDefined();
      expect(schema.script.script).toBeTruthy();
      expect(schema.script.script).not.toContain("./");
    });
  });

  describe("Function Execution", () => {
    it("should lighten a dark color in P3 space", async () => {
      const result = await executeWithSchema(
        "ts_lighten_p3",
        "function",
        `
        variable color: Color.P3;
        color.r = 0.2; color.g = 0.3; color.b = 0.4;
        ts_lighten_p3(color, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      expect(r).toBeCloseTo(0.6, 1);
      expect(g).toBeCloseTo(0.65, 1);
      expect(b).toBeCloseTo(0.7, 1);
    });

    it("should use default amount of 0.25", async () => {
      const result = await executeWithSchema(
        "ts_lighten_p3",
        "function",
        `
        variable color: Color.P3;
        color.r = 0.4; color.g = 0.4; color.b = 0.4;
        ts_lighten_p3(color)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      expect(r).toBeCloseTo(0.55, 1);
    });

    it("should not exceed 1.0 per channel", async () => {
      const result = await executeWithSchema(
        "ts_lighten_p3",
        "function",
        `
        variable color: Color.P3;
        color.r = 0.95; color.g = 0.95; color.b = 0.95;
        ts_lighten_p3(color, 0.9)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      expect(r).toBeLessThanOrEqual(1);
    });

    it("should output in P3 color space", async () => {
      const result = await executeWithSchema(
        "ts_lighten_p3",
        "function",
        `
        variable color: Color.P3;
        color.r = 0.5; color.g = 0.3; color.b = 0.7;
        ts_lighten_p3(color, 0.1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).value.r).toBeDefined();
      expect((result as any).value.g).toBeDefined();
      expect((result as any).value.b).toBeDefined();
    });
  });
});
