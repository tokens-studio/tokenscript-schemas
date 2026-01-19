/**
 * Unit tests for the Distance function
 * Calculates Euclidean distance between colors in perceptual color space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Distance Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("distance", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Distance");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("distance");
    });
  });

  describe("Function Execution", () => {
    it("should return 0 for identical colors", async () => {
      const result = await executeWithSchema(
        "distance",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 0; c2.b = 0;
        distance(c1, c2)
        `,
      );

      expect(result?.constructor.name).toBe("NumberSymbol");
      expect((result as any).value).toBeCloseTo(0, 5);
    });

    it("should return small distance for similar colors", async () => {
      const result = await executeWithSchema(
        "distance",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 0.95; c2.g = 0.05; c2.b = 0.05;
        distance(c1, c2)
        `,
      );

      expect(result?.constructor.name).toBe("NumberSymbol");
      const dist = (result as any).value;
      expect(dist).toBeGreaterThan(0);
      expect(dist).toBeLessThan(0.1);
    });

    it("should return larger distance for different colors", async () => {
      const result = await executeWithSchema(
        "distance",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 0; c2.g = 1; c2.b = 0;
        distance(c1, c2)
        `,
      );

      expect(result?.constructor.name).toBe("NumberSymbol");
      const dist = (result as any).value;
      expect(dist).toBeGreaterThan(0.2);
    });

    it("should return maximum distance for black vs white", async () => {
      const result = await executeWithSchema(
        "distance",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        distance(black, white)
        `,
      );

      expect(result?.constructor.name).toBe("NumberSymbol");
      const dist = (result as any).value;
      // In OKLab, black to white is about 1.0 (lightness difference)
      expect(dist).toBeGreaterThan(0.9);
      expect(dist).toBeLessThan(1.1);
    });

    it("should work with Lab color space", async () => {
      const result = await executeWithSchema(
        "distance",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 0; c2.g = 0; c2.b = 1;
        distance(c1, c2, "lab")
        `,
      );

      expect(result?.constructor.name).toBe("NumberSymbol");
      const dist = (result as any).value;
      // Red to blue in Lab is a significant distance
      expect(dist).toBeGreaterThan(50);
    });

    it("should give different results for oklab vs lab", async () => {
      const resultOklab = await executeWithSchema(
        "distance",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.5; c1.g = 0.5; c1.b = 0.5;
        variable c2: Color.SRGB;
        c2.r = 0.6; c2.g = 0.4; c2.b = 0.5;
        distance(c1, c2, "oklab")
        `,
      );

      const resultLab = await executeWithSchema(
        "distance",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.5; c1.g = 0.5; c1.b = 0.5;
        variable c2: Color.SRGB;
        c2.r = 0.6; c2.g = 0.4; c2.b = 0.5;
        distance(c1, c2, "lab")
        `,
      );

      const oklabDist = (resultOklab as any).value;
      const labDist = (resultLab as any).value;

      // They should be different (Lab values are larger scale)
      expect(oklabDist).not.toBeCloseTo(labDist, 1);
    });
  });
});
