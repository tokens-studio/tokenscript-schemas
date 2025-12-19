import { describe, expect, it } from "vitest";
import {
  executeWithSchema,
} from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";

describe("Delta E OK Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const { getBundledSchema } = await import("@tests/helpers/schema-test-utils");
      const schema = await getBundledSchema("delta_e_ok", "function");

      expect(schema.name).toBe("Delta E OK");
      expect(schema.type).toBe("function");
      expect((schema as any).keyword).toBe("delta_e_ok");
    });
  });

  describe("Basic Calculations", () => {
    it("should return 0 for identical colors", async () => {
      const result = await executeWithSchema(
        "delta_e_ok",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.5; c1.g = 0.3; c1.b = 0.7;
        variable c2: Color.SRGB;
        c2.r = 0.5; c2.g = 0.3; c2.b = 0.7;
        delta_e_ok(c1, c2)
        `,
      );

      expect(result.value).toBeCloseTo(0, 5);
    });

    it("should return small value for very similar colors", async () => {
      const result = await executeWithSchema(
        "delta_e_ok",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.5; c1.g = 0.5; c1.b = 0.5;
        variable c2: Color.SRGB;
        c2.r = 0.51; c2.g = 0.5; c2.b = 0.5;
        delta_e_ok(c1, c2)
        `,
      );

      // Very small difference
      expect(result.value).toBeLessThan(0.05);
      expect(result.value).toBeGreaterThan(0);
    });

    it("should return large value for very different colors", async () => {
      const result = await executeWithSchema(
        "delta_e_ok",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 1; c2.b = 1;
        delta_e_ok(c1, c2)
        `,
      );

      // Black vs white is a very large difference
      expect(result.value).toBeGreaterThan(0.9);
    });
  });

  describe("Symmetry", () => {
    it("should be symmetric - order of colors should not matter", async () => {
      const result1 = await executeWithSchema(
        "delta_e_ok",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.2; c1.g = 0.4; c1.b = 0.6;
        variable c2: Color.SRGB;
        c2.r = 0.6; c2.g = 0.2; c2.b = 0.4;
        delta_e_ok(c1, c2)
        `,
      );

      const result2 = await executeWithSchema(
        "delta_e_ok",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.6; c1.g = 0.2; c1.b = 0.4;
        variable c2: Color.SRGB;
        c2.r = 0.2; c2.g = 0.4; c2.b = 0.6;
        delta_e_ok(c1, c2)
        `,
      );

      expect(result1.value).toBeCloseTo(result2.value, 10);
    });
  });

  describe("Color.js Parity", () => {
    it("should match Color.js deltaE for black vs white", async () => {
      const result = await executeWithSchema(
        "delta_e_ok",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 1; c2.b = 1;
        delta_e_ok(c1, c2)
        `,
      );

      const black = new Color("srgb", [0, 0, 0]);
      const white = new Color("srgb", [1, 1, 1]);
      const colorJsDeltaE = black.deltaE(white, "OK");

      expect(result.value).toBeCloseTo(colorJsDeltaE, 3);
    });

    it("should match Color.js deltaE for red vs blue", async () => {
      const result = await executeWithSchema(
        "delta_e_ok",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 0; c2.g = 0; c2.b = 1;
        delta_e_ok(c1, c2)
        `,
      );

      const red = new Color("srgb", [1, 0, 0]);
      const blue = new Color("srgb", [0, 0, 1]);
      const colorJsDeltaE = red.deltaE(blue, "OK");

      expect(result.value).toBeCloseTo(colorJsDeltaE, 3);
    });

    it("should match Color.js deltaE for similar grays", async () => {
      const result = await executeWithSchema(
        "delta_e_ok",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.5; c1.g = 0.5; c1.b = 0.5;
        variable c2: Color.SRGB;
        c2.r = 0.55; c2.g = 0.55; c2.b = 0.55;
        delta_e_ok(c1, c2)
        `,
      );

      const gray1 = new Color("srgb", [0.5, 0.5, 0.5]);
      const gray2 = new Color("srgb", [0.55, 0.55, 0.55]);
      const colorJsDeltaE = gray1.deltaE(gray2, "OK");

      expect(result.value).toBeCloseTo(colorJsDeltaE, 3);
    });

    it("should match Color.js deltaE for chromatic colors", async () => {
      const result = await executeWithSchema(
        "delta_e_ok",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.8; c1.g = 0.2; c1.b = 0.4;
        variable c2: Color.SRGB;
        c2.r = 0.3; c2.g = 0.6; c2.b = 0.5;
        delta_e_ok(c1, c2)
        `,
      );

      const color1 = new Color("srgb", [0.8, 0.2, 0.4]);
      const color2 = new Color("srgb", [0.3, 0.6, 0.5]);
      const colorJsDeltaE = color1.deltaE(color2, "OK");

      expect(result.value).toBeCloseTo(colorJsDeltaE, 3);
    });
  });

  describe("Perceptual Thresholds", () => {
    it("should detect imperceptible difference (< 0.02 JND)", async () => {
      const result = await executeWithSchema(
        "delta_e_ok",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.5; c1.g = 0.5; c1.b = 0.5;
        variable c2: Color.SRGB;
        c2.r = 0.502; c2.g = 0.5; c2.b = 0.5;
        delta_e_ok(c1, c2)
        `,
      );

      // Should be below JND threshold
      expect(result.value).toBeLessThan(0.02);
    });
  });

  describe("Edge Cases", () => {
    it("should handle primary colors", async () => {
      const result = await executeWithSchema(
        "delta_e_ok",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 0; c2.g = 1; c2.b = 0;
        delta_e_ok(c1, c2)
        `,
      );

      // Red vs green should be a significant difference
      expect(result.value).toBeGreaterThan(0.3);
    });

    it("should always return non-negative values", async () => {
      const result = await executeWithSchema(
        "delta_e_ok",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.1; c1.g = 0.9; c1.b = 0.5;
        variable c2: Color.SRGB;
        c2.r = 0.9; c2.g = 0.1; c2.b = 0.5;
        delta_e_ok(c1, c2)
        `,
      );

      expect(result.value).toBeGreaterThanOrEqual(0);
    });
  });
});

