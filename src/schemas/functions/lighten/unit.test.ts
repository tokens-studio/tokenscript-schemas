/**
 * Unit tests for the Lighten function
 * Increases color lightness in OKLab perceptual space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Lighten Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("lighten", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Lighten");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("lighten");
    });

    it("should have script defined", async () => {
      const schema = (await getBundledSchema("lighten", "function")) as FunctionSpecification;

      expect(schema.script).toBeDefined();
      expect(schema.script.script).toBeTruthy();
      expect(schema.script.script).not.toContain("./");
    });
  });

  describe("Function Execution", () => {
    it("should lighten a dark color", async () => {
      const result = await executeWithSchema(
        "lighten",
        "function",
        `
        variable dark: Color.SRGB;
        dark.r = 0.2; dark.g = 0.2; dark.b = 0.4;
        lighten(dark, 0.2)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // Lightened color should have higher luminance
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      expect(r).toBeGreaterThan(0.2);
      expect(g).toBeGreaterThan(0.2);
      expect(b).toBeGreaterThan(0.4);
    });

    it("should use default amount of 0.25", async () => {
      const result = await executeWithSchema(
        "lighten",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.3; color.g = 0.3; color.b = 0.3;
        lighten(color)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      expect(r).toBeGreaterThan(0.3);
    });

    it("should not exceed maximum lightness", async () => {
      const result = await executeWithSchema(
        "lighten",
        "function",
        `
        variable bright: Color.SRGB;
        bright.r = 0.9; bright.g = 0.9; bright.b = 0.9;
        lighten(bright, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // Should be clamped to valid range
      expect(r).toBeLessThanOrEqual(1);
      expect(g).toBeLessThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(1);
    });

    it("should preserve hue when lightening", async () => {
      const result = await executeWithSchema(
        "lighten",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 0.6; red.g = 0.1; red.b = 0.1;
        lighten(red, 0.15)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // Red should still dominate
      expect(r).toBeGreaterThan(g);
      expect(r).toBeGreaterThan(b);
    });
  });
});
