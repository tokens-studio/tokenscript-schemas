/**
 * Unit tests for the Alpha sRGB function
 * Sets alpha on a color converted to sRGB space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Alpha sRGB Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("ts_alpha_srgb", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Alpha sRGB");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("ts_alpha_srgb");
    });

    it("should have script defined", async () => {
      const schema = (await getBundledSchema("ts_alpha_srgb", "function")) as FunctionSpecification;

      expect(schema.script).toBeDefined();
      expect(schema.script.script).toBeTruthy();
      expect(schema.script.script).not.toContain("./");
    });
  });

  describe("Function Execution", () => {
    it("should set alpha to 0.5", async () => {
      const result = await executeWithSchema(
        "ts_alpha_srgb",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.8; color.g = 0.3; color.b = 0.5;
        ts_alpha_srgb(color, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(0.5);
    });

    it("should set alpha to 0 (fully transparent)", async () => {
      const result = await executeWithSchema(
        "ts_alpha_srgb",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.5; color.g = 0.5; color.b = 0.5;
        ts_alpha_srgb(color, 0)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(0);
    });

    it("should set alpha to 1 (fully opaque)", async () => {
      const result = await executeWithSchema(
        "ts_alpha_srgb",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.2; color.g = 0.5; color.b = 0.3;
        ts_alpha_srgb(color, 1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(1);
    });

    it("should clamp alpha below 0", async () => {
      const result = await executeWithSchema(
        "ts_alpha_srgb",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.5; color.g = 0.5; color.b = 0.5;
        ts_alpha_srgb(color, -0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(0);
    });

    it("should clamp alpha above 1", async () => {
      const result = await executeWithSchema(
        "ts_alpha_srgb",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.5; color.g = 0.5; color.b = 0.5;
        ts_alpha_srgb(color, 1.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(1);
    });

    it("should preserve RGB values", async () => {
      const result = await executeWithSchema(
        "ts_alpha_srgb",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.9; color.g = 0.1; color.b = 0.2;
        ts_alpha_srgb(color, 0.7)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      expect(r).toBeCloseTo(0.9, 1);
      expect(g).toBeCloseTo(0.1, 1);
      expect(b).toBeCloseTo(0.2, 1);
    });
  });
});
