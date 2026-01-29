/**
 * Unit tests for the Darken sRGB function
 * Decreases lightness by interpolating each channel toward black in sRGB space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Darken sRGB Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "ts_darken_srgb",
        "function",
      )) as FunctionSpecification;

      expect(schema.name).toBe("Darken sRGB");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("ts_darken_srgb");
    });

    it("should have script defined", async () => {
      const schema = (await getBundledSchema(
        "ts_darken_srgb",
        "function",
      )) as FunctionSpecification;

      expect(schema.script).toBeDefined();
      expect(schema.script.script).toBeTruthy();
      expect(schema.script.script).not.toContain("./");
    });
  });

  describe("Function Execution", () => {
    it("should darken a light color in sRGB space", async () => {
      const result = await executeWithSchema(
        "ts_darken_srgb",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.8; color.g = 0.6; color.b = 0.4;
        ts_darken_srgb(color, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // r: 0.8 * (1 - 0.5) = 0.4
      // g: 0.6 * (1 - 0.5) = 0.3
      // b: 0.4 * (1 - 0.5) = 0.2
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      expect(r).toBeCloseTo(0.4, 1);
      expect(g).toBeCloseTo(0.3, 1);
      expect(b).toBeCloseTo(0.2, 1);
    });

    it("should use default amount of 0.25", async () => {
      const result = await executeWithSchema(
        "ts_darken_srgb",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.8; color.g = 0.8; color.b = 0.8;
        ts_darken_srgb(color)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // 0.8 * (1 - 0.25) = 0.6
      const r = (result as any).value.r.value;
      expect(r).toBeCloseTo(0.6, 1);
    });

    it("should not go below 0 per channel", async () => {
      const result = await executeWithSchema(
        "ts_darken_srgb",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.05; color.g = 0.05; color.b = 0.05;
        ts_darken_srgb(color, 0.99)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      expect(r).toBeGreaterThanOrEqual(0);
    });

    it("should output in sRGB color space", async () => {
      const result = await executeWithSchema(
        "ts_darken_srgb",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.5; color.g = 0.3; color.b = 0.7;
        ts_darken_srgb(color, 0.1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).value.r).toBeDefined();
      expect((result as any).value.g).toBeDefined();
      expect((result as any).value.b).toBeDefined();
    });
  });
});
