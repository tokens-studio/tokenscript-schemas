/**
 * Unit tests for the Mix function
 * Interpolates between two colors in OKLCH space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Mix Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("mix", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Mix");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("mix");
    });
  });

  describe("Function Execution", () => {
    it("should mix red and blue at 50%", async () => {
      const result = await executeWithSchema(
        "mix",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        variable blue: Color.SRGB;
        blue.r = 0; blue.g = 0; blue.b = 1;
        mix(red, blue, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const b = (result as any).value.b.value;
      // Should have both red and blue components
      expect(r).toBeGreaterThan(0.2);
      expect(b).toBeGreaterThan(0.2);
    });

    it("should return first color at 0%", async () => {
      const result = await executeWithSchema(
        "mix",
        "function",
        `
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        mix(white, black, 0)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      expect(r).toBeCloseTo(1, 1);
    });

    it("should return second color at 100%", async () => {
      const result = await executeWithSchema(
        "mix",
        "function",
        `
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        mix(white, black, 1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      expect(r).toBeCloseTo(0, 1);
    });

    it("should default to 50% mix", async () => {
      const result = await executeWithSchema(
        "mix",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.8; c1.g = 0.2; c1.b = 0.2;
        variable c2: Color.SRGB;
        c2.r = 0.2; c2.g = 0.8; c2.b = 0.2;
        mix(c1, c2)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
    });
  });
});
