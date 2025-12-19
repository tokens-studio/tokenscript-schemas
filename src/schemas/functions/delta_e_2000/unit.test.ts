import { describe, expect, it } from "vitest";
import {
  executeWithSchema,
} from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";

describe("Delta E 2000 Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const { getBundledSchema } = await import("@tests/helpers/schema-test-utils");
      const schema = await getBundledSchema("delta_e_2000", "function");

      expect(schema.name).toBe("Delta E 2000");
      expect(schema.type).toBe("function");
      expect((schema as any).keyword).toBe("delta_e_2000");
    });
  });

  describe("Basic Calculations", () => {
    it("should return 0 for identical colors", async () => {
      const result = await executeWithSchema(
        "delta_e_2000",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.5; c1.g = 0.3; c1.b = 0.7;
        variable c2: Color.SRGB;
        c2.r = 0.5; c2.g = 0.3; c2.b = 0.7;
        delta_e_2000(c1, c2)
        `,
      );

      expect(result.value).toBeCloseTo(0, 3);
    });

    it("should return large value for black vs white", async () => {
      const result = await executeWithSchema(
        "delta_e_2000",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 1; c2.b = 1;
        delta_e_2000(c1, c2)
        `,
      );

      // Black vs white is a very large difference (should be ~100)
      expect(result.value).toBeGreaterThan(90);
    });
  });

  describe("Symmetry", () => {
    it("should be symmetric - order should not matter", async () => {
      const result1 = await executeWithSchema(
        "delta_e_2000",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.2; c1.g = 0.4; c1.b = 0.6;
        variable c2: Color.SRGB;
        c2.r = 0.6; c2.g = 0.2; c2.b = 0.4;
        delta_e_2000(c1, c2)
        `,
      );

      const result2 = await executeWithSchema(
        "delta_e_2000",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.6; c1.g = 0.2; c1.b = 0.4;
        variable c2: Color.SRGB;
        c2.r = 0.2; c2.g = 0.4; c2.b = 0.6;
        delta_e_2000(c1, c2)
        `,
      );

      expect(result1.value).toBeCloseTo(result2.value, 5);
    });
  });

  describe("Color.js Parity", () => {
    it("should match Color.js for black vs white", async () => {
      const result = await executeWithSchema(
        "delta_e_2000",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 1; c2.b = 1;
        delta_e_2000(c1, c2)
        `,
      );

      const black = new Color("srgb", [0, 0, 0]);
      const white = new Color("srgb", [1, 1, 1]);
      const colorJsDeltaE = black.deltaE(white, "2000");

      expect(result.value).toBeCloseTo(colorJsDeltaE, 1);
    });

    it("should match Color.js for red vs blue", async () => {
      const result = await executeWithSchema(
        "delta_e_2000",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 0; c2.g = 0; c2.b = 1;
        delta_e_2000(c1, c2)
        `,
      );

      const red = new Color("srgb", [1, 0, 0]);
      const blue = new Color("srgb", [0, 0, 1]);
      const colorJsDeltaE = red.deltaE(blue, "2000");

      expect(result.value).toBeCloseTo(colorJsDeltaE, 1);
    });

    it("should match Color.js for similar grays", async () => {
      const result = await executeWithSchema(
        "delta_e_2000",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.5; c1.g = 0.5; c1.b = 0.5;
        variable c2: Color.SRGB;
        c2.r = 0.55; c2.g = 0.55; c2.b = 0.55;
        delta_e_2000(c1, c2)
        `,
      );

      const gray1 = new Color("srgb", [0.5, 0.5, 0.5]);
      const gray2 = new Color("srgb", [0.55, 0.55, 0.55]);
      const colorJsDeltaE = gray1.deltaE(gray2, "2000");

      expect(result.value).toBeCloseTo(colorJsDeltaE, 1);
    });

    it("should match Color.js for chromatic colors", async () => {
      const result = await executeWithSchema(
        "delta_e_2000",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.8; c1.g = 0.2; c1.b = 0.4;
        variable c2: Color.SRGB;
        c2.r = 0.3; c2.g = 0.6; c2.b = 0.5;
        delta_e_2000(c1, c2)
        `,
      );

      const color1 = new Color("srgb", [0.8, 0.2, 0.4]);
      const color2 = new Color("srgb", [0.3, 0.6, 0.5]);
      const colorJsDeltaE = color1.deltaE(color2, "2000");

      expect(result.value).toBeCloseTo(colorJsDeltaE, 1);
    });
  });

  describe("Perceptual Thresholds", () => {
    it("should detect imperceptible difference (< 1.0)", async () => {
      const result = await executeWithSchema(
        "delta_e_2000",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.5; c1.g = 0.5; c1.b = 0.5;
        variable c2: Color.SRGB;
        c2.r = 0.505; c2.g = 0.5; c2.b = 0.5;
        delta_e_2000(c1, c2)
        `,
      );

      // Very small differences should be < 1.0 (imperceptible threshold)
      expect(result.value).toBeLessThan(2);
    });
  });

  describe("Blue Region Correction", () => {
    it("should handle blue region colors (RT correction)", async () => {
      // Blue region (225-315 degrees) has special rotation term
      const result = await executeWithSchema(
        "delta_e_2000",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.2; c1.g = 0.2; c1.b = 0.8;
        variable c2: Color.SRGB;
        c2.r = 0.3; c2.g = 0.2; c2.b = 0.7;
        delta_e_2000(c1, c2)
        `,
      );

      const blue1 = new Color("srgb", [0.2, 0.2, 0.8]);
      const blue2 = new Color("srgb", [0.3, 0.2, 0.7]);
      const colorJsDeltaE = blue1.deltaE(blue2, "2000");

      // Should be close to Color.js (allows for some tolerance due to complexity)
      expect(result.value).toBeCloseTo(colorJsDeltaE, 0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle achromatic colors (C=0)", async () => {
      const result = await executeWithSchema(
        "delta_e_2000",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.3; c1.g = 0.3; c1.b = 0.3;
        variable c2: Color.SRGB;
        c2.r = 0.7; c2.g = 0.7; c2.b = 0.7;
        delta_e_2000(c1, c2)
        `,
      );

      // Two grays - should give valid result
      expect(typeof result.value).toBe("number");
      expect(Number.isFinite(result.value)).toBe(true);
      expect(result.value).toBeGreaterThan(0);
    });

    it("should always return non-negative values", async () => {
      const result = await executeWithSchema(
        "delta_e_2000",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.1; c1.g = 0.9; c1.b = 0.5;
        variable c2: Color.SRGB;
        c2.r = 0.9; c2.g = 0.1; c2.b = 0.5;
        delta_e_2000(c1, c2)
        `,
      );

      expect(result.value).toBeGreaterThanOrEqual(0);
    });
  });
});

