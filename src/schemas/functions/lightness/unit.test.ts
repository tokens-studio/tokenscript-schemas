/**
 * Unit tests for the lightness function
 * Extracts perceptual lightness from a color
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("lightness function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("lightness", "function")) as FunctionSpecification;

      expect(schema.name).toBe("lightness");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should return 1 for white", async () => {
      const result = await executeWithSchema(
        "lightness",
        "function",
        `
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        lightness(white)
        `,
      );

      expect(result).toBeDefined();
      const l = (result as any).value ?? result;
      expect(l).toBeCloseTo(1, 1);
    });

    it("should return 0 for black", async () => {
      const result = await executeWithSchema(
        "lightness",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        lightness(black)
        `,
      );

      expect(result).toBeDefined();
      const l = (result as any).value ?? result;
      expect(l).toBeCloseTo(0, 1);
    });

    it("should return ~0.6 for mid-gray", async () => {
      const result = await executeWithSchema(
        "lightness",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        lightness(gray)
        `,
      );

      expect(result).toBeDefined();
      const l = (result as any).value ?? result;
      // OKLCH lightness for mid-gray is around 0.6
      expect(l).toBeGreaterThan(0.5);
      expect(l).toBeLessThan(0.8);
    });

    it("should show yellow is lighter than blue", async () => {
      const yellowResult = await executeWithSchema(
        "lightness",
        "function",
        `
        variable yellow: Color.SRGB;
        yellow.r = 1; yellow.g = 1; yellow.b = 0;
        lightness(yellow)
        `,
      );

      const blueResult = await executeWithSchema(
        "lightness",
        "function",
        `
        variable blue: Color.SRGB;
        blue.r = 0; blue.g = 0; blue.b = 1;
        lightness(blue)
        `,
      );

      const yellowL = (yellowResult as any).value ?? yellowResult;
      const blueL = (blueResult as any).value ?? blueResult;

      // Yellow is perceptually much lighter than blue
      expect(yellowL).toBeGreaterThan(blueL);
    });
  });
});
