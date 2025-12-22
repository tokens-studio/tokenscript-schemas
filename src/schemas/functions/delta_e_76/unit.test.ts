import { executeWithSchema } from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";
import { describe, expect, it } from "vitest";

describe("Delta E 76 Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const { getBundledSchema } = await import("@tests/helpers/schema-test-utils");
      const schema = await getBundledSchema("delta_e_76", "function");

      expect(schema.name).toBe("Delta E 76");
      expect(schema.type).toBe("function");
      expect((schema as any).keyword).toBe("delta_e_76");
    });
  });

  describe("Basic Calculations", () => {
    it("should return 0 for identical colors", async () => {
      const result = await executeWithSchema(
        "delta_e_76",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.5; c1.g = 0.3; c1.b = 0.7;
        variable c2: Color.SRGB;
        c2.r = 0.5; c2.g = 0.3; c2.b = 0.7;
        delta_e_76(c1, c2)
        `,
      );

      expect(result.value).toBeCloseTo(0, 3);
    });

    it("should return large value for black vs white", async () => {
      const result = await executeWithSchema(
        "delta_e_76",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 1; c2.b = 1;
        delta_e_76(c1, c2)
        `,
      );

      // Black vs white in Lab: L difference is ~100
      expect(result.value).toBeGreaterThan(90);
    });
  });

  describe("Color.js Parity", () => {
    it("should match Color.js for black vs white", async () => {
      const result = await executeWithSchema(
        "delta_e_76",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 1; c2.b = 1;
        delta_e_76(c1, c2)
        `,
      );

      const black = new Color("srgb", [0, 0, 0]);
      const white = new Color("srgb", [1, 1, 1]);
      const colorJsDeltaE = black.deltaE(white, "76");

      expect(result.value).toBeCloseTo(colorJsDeltaE, 1);
    });

    it("should match Color.js for chromatic colors", async () => {
      const result = await executeWithSchema(
        "delta_e_76",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.8; c1.g = 0.2; c1.b = 0.2;
        variable c2: Color.SRGB;
        c2.r = 0.2; c2.g = 0.6; c2.b = 0.8;
        delta_e_76(c1, c2)
        `,
      );

      const color1 = new Color("srgb", [0.8, 0.2, 0.2]);
      const color2 = new Color("srgb", [0.2, 0.6, 0.8]);
      const colorJsDeltaE = color1.deltaE(color2, "76");

      expect(result.value).toBeCloseTo(colorJsDeltaE, 1);
    });
  });

  describe("Symmetry", () => {
    it("should be symmetric", async () => {
      const result1 = await executeWithSchema(
        "delta_e_76",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.3; c1.g = 0.5; c1.b = 0.7;
        variable c2: Color.SRGB;
        c2.r = 0.7; c2.g = 0.3; c2.b = 0.5;
        delta_e_76(c1, c2)
        `,
      );

      const result2 = await executeWithSchema(
        "delta_e_76",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.7; c1.g = 0.3; c1.b = 0.5;
        variable c2: Color.SRGB;
        c2.r = 0.3; c2.g = 0.5; c2.b = 0.7;
        delta_e_76(c1, c2)
        `,
      );

      expect(result1.value).toBeCloseTo(result2.value, 5);
    });
  });
});
