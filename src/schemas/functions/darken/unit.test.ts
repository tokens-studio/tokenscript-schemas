/**
 * Unit tests for the Darken function
 * Decreases color lightness in OKLab perceptual space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Darken Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("darken", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Darken");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("darken");
    });

    it("should have script defined", async () => {
      const schema = (await getBundledSchema("darken", "function")) as FunctionSpecification;

      expect(schema.script).toBeDefined();
      expect(schema.script.script).toBeTruthy();
    });
  });

  describe("Function Execution", () => {
    it("should darken a light color", async () => {
      const result = await executeWithSchema(
        "darken",
        "function",
        `
        variable light: Color.SRGB;
        light.r = 0.8; light.g = 0.8; light.b = 0.9;
        darken(light, 0.2)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      expect(r).toBeLessThan(0.8);
      expect(g).toBeLessThan(0.8);
      expect(b).toBeLessThan(0.9);
    });

    it("should use default amount of 0.25", async () => {
      const result = await executeWithSchema(
        "darken",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.7; color.g = 0.7; color.b = 0.7;
        darken(color)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      expect(r).toBeLessThan(0.7);
    });

    it("should not go below minimum lightness", async () => {
      const result = await executeWithSchema(
        "darken",
        "function",
        `
        variable dark: Color.SRGB;
        dark.r = 0.1; dark.g = 0.1; dark.b = 0.1;
        darken(dark, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      expect(r).toBeGreaterThanOrEqual(0);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(b).toBeGreaterThanOrEqual(0);
    });

    it("should preserve hue when darkening", async () => {
      const result = await executeWithSchema(
        "darken",
        "function",
        `
        variable blue: Color.SRGB;
        blue.r = 0.3; blue.g = 0.5; blue.b = 0.9;
        darken(blue, 0.15)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // Blue should still dominate
      expect(b).toBeGreaterThan(r);
      expect(b).toBeGreaterThan(g);
    });
  });
});
