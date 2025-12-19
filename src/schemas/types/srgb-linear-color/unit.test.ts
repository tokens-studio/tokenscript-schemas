/**
 * Linear sRGB Color Schema Tests
 *
 * Tests for the Linear sRGB color space (gamma-decoded)
 * Validates against ColorJS for parity
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

// ColorJS reference tolerance
const TOLERANCE = 1e-9;

describe("Linear sRGB Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("srgb-linear-color")) as ColorSpecification;

      expect(schema.name).toBe("LinearSRGB");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("r");
      expect(schema.schema?.properties).toHaveProperty("g");
      expect(schema.schema?.properties).toHaveProperty("b");
      expect(schema.schema?.required).toEqual(["r", "g", "b"]);
    });

    it("should have linearsrgb initializer", async () => {
      const schema = (await getBundledSchema("srgb-linear-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("linearsrgb");
      expect(schema.initializers[0].script.script).toContain("Color.LinearSRGB");
    });

    it("should have conversion from sRGB", async () => {
      const schema = (await getBundledSchema("srgb-linear-color")) as ColorSpecification;

      expect(schema.conversions.length).toBeGreaterThanOrEqual(1);

      const srgbToLinear = schema.conversions.find((c: { source: string }) =>
        c.source.includes("srgb-color"),
      );
      expect(srgbToLinear).toBeDefined();
      expect(srgbToLinear?.lossless).toBe(true);
    });
  });

  describe("Initialization", () => {
    it("should create linear sRGB color from values", async () => {
      const result = await executeWithSchema(
        "srgb-linear-color",
        "type",
        `
        variable c: Color.LinearSRGB;
        c.r = 0.5;
        c.g = 0.25;
        c.b = 0.1;
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("LinearSRGB");
      expect((result as any).value.r.value).toBeCloseTo(0.5, 10);
      expect((result as any).value.g.value).toBeCloseTo(0.25, 10);
      expect((result as any).value.b.value).toBeCloseTo(0.1, 10);
    });
  });

  describe("Conversion from sRGB to Linear sRGB", () => {
    it("should convert sRGB red to linear sRGB", async () => {
      const result = await executeWithSchema(
        "srgb-linear-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 0;
        srgb.b = 0;
        srgb.to.linearsrgb()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("srgb", [1, 0, 0]).to("srgb-linear");

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("LinearSRGB");
      expect((result as any).value.r.value).toBeCloseTo(colorJS.coords[0], 9);
      expect((result as any).value.g.value).toBeCloseTo(colorJS.coords[1], 9);
      expect((result as any).value.b.value).toBeCloseTo(colorJS.coords[2], 9);
    });

    it("should convert mid-gray sRGB to linear (tests gamma curve)", async () => {
      // Mid-gray (0.5) is a good test for the gamma curve
      // Linear value should be ~0.214 (not 0.5!)
      const result = await executeWithSchema(
        "srgb-linear-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0.5;
        srgb.g = 0.5;
        srgb.b = 0.5;
        srgb.to.linearsrgb()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("srgb", [0.5, 0.5, 0.5]).to("srgb-linear");

      console.log(`\n=== MID-GRAY Gamma Conversion ===`);
      console.log(`Input sRGB:       { r: 0.5, g: 0.5, b: 0.5 }`);
      console.log(
        `TokenScript:      { r: ${(result as any).value.r.value}, g: ${(result as any).value.g.value}, b: ${(result as any).value.b.value} }`,
      );
      console.log(
        `ColorJS:          { r: ${colorJS.coords[0]}, g: ${colorJS.coords[1]}, b: ${colorJS.coords[2]} }`,
      );

      expect((result as any).value.r.value).toBeCloseTo(colorJS.coords[0], 9);
      expect((result as any).value.g.value).toBeCloseTo(colorJS.coords[1], 9);
      expect((result as any).value.b.value).toBeCloseTo(colorJS.coords[2], 9);
    });

    it("should handle linear region (sRGB ≤ 0.04045)", async () => {
      // Test value below threshold - should use linear formula
      const result = await executeWithSchema(
        "srgb-linear-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0.03;
        srgb.g = 0.03;
        srgb.b = 0.03;
        srgb.to.linearsrgb()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("srgb", [0.03, 0.03, 0.03]).to("srgb-linear");

      // Linear formula: 0.03 / 12.92 ≈ 0.00232
      expect((result as any).value.r.value).toBeCloseTo(colorJS.coords[0], 9);
      expect((result as any).value.g.value).toBeCloseTo(colorJS.coords[1], 9);
      expect((result as any).value.b.value).toBeCloseTo(colorJS.coords[2], 9);
    });

    it("should handle threshold boundary (0.04045)", async () => {
      // Test exactly at threshold
      const result = await executeWithSchema(
        "srgb-linear-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0.04045;
        srgb.g = 0.04045;
        srgb.b = 0.04045;
        srgb.to.linearsrgb()
      `,
      );

      const colorJS = new Color("srgb", [0.04045, 0.04045, 0.04045]).to("srgb-linear");

      expect((result as any).value.r.value).toBeCloseTo(colorJS.coords[0], 9);
    });
  });

  describe("ColorJS Parity", () => {
    const testCases = [
      { name: "red", srgb: [1, 0, 0] },
      { name: "green", srgb: [0, 1, 0] },
      { name: "blue", srgb: [0, 0, 1] },
      { name: "black", srgb: [0, 0, 0] },
      { name: "white", srgb: [1, 1, 1] },
      { name: "gray-50%", srgb: [0.5, 0.5, 0.5] },
      { name: "gray-21.8%", srgb: [0.218, 0.218, 0.218] }, // Linear 0.04 approx
      { name: "coral", srgb: [1, 0.341, 0.2] },
      { name: "near-black", srgb: [0.01, 0.01, 0.01] },
      { name: "near-white", srgb: [0.99, 0.99, 0.99] },
    ];

    for (const { name, srgb } of testCases) {
      it(`should match ColorJS for ${name}`, async () => {
        const result = await executeWithSchema(
          "srgb-linear-color",
          "type",
          `
          variable srgb: Color.SRGB;
          srgb.r = ${srgb[0]};
          srgb.g = ${srgb[1]};
          srgb.b = ${srgb[2]};
          srgb.to.linearsrgb()
        `,
        );

        // ColorJS reference
        const colorJS = new Color("srgb", srgb as [number, number, number]).to("srgb-linear");

        const tsR = (result as any).value.r.value;
        const tsG = (result as any).value.g.value;
        const tsB = (result as any).value.b.value;

        const diffR = Math.abs(tsR - colorJS.coords[0]);
        const diffG = Math.abs(tsG - colorJS.coords[1]);
        const diffB = Math.abs(tsB - colorJS.coords[2]);
        const maxDiff = Math.max(diffR, diffG, diffB);

        console.log(`\n=== ${name.toUpperCase()} ColorJS Parity ===`);
        console.log(`Input sRGB:  { r: ${srgb[0]}, g: ${srgb[1]}, b: ${srgb[2]} }`);
        console.log(
          `TokenScript: { r: ${tsR.toFixed(9)}, g: ${tsG.toFixed(9)}, b: ${tsB.toFixed(9)} }`,
        );
        console.log(
          `ColorJS:     { r: ${colorJS.coords[0].toFixed(9)}, g: ${colorJS.coords[1].toFixed(9)}, b: ${colorJS.coords[2].toFixed(9)} }`,
        );
        console.log(`Max Diff:    ${maxDiff.toExponential(2)}`);
        console.log(`Status:      ${maxDiff < TOLERANCE ? "✅ PASS" : "❌ FAIL"}`);

        expect(maxDiff).toBeLessThan(TOLERANCE);
      });
    }
  });

  describe("Edge Cases", () => {
    it("should handle pure black (0, 0, 0)", async () => {
      const result = await executeWithSchema(
        "srgb-linear-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0;
        srgb.g = 0;
        srgb.b = 0;
        srgb.to.linearsrgb()
      `,
      );

      expect((result as any).value.r.value).toBe(0);
      expect((result as any).value.g.value).toBe(0);
      expect((result as any).value.b.value).toBe(0);
    });

    it("should handle pure white (1, 1, 1)", async () => {
      const result = await executeWithSchema(
        "srgb-linear-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 1;
        srgb.b = 1;
        srgb.to.linearsrgb()
      `,
      );

      expect((result as any).value.r.value).toBeCloseTo(1, 9);
      expect((result as any).value.g.value).toBeCloseTo(1, 9);
      expect((result as any).value.b.value).toBeCloseTo(1, 9);
    });
  });

  describe("Conversion Chain: RGB → sRGB → Linear sRGB", () => {
    it("should convert RGB 255 through to linear sRGB", async () => {
      const result = await executeWithSchema(
        "srgb-linear-color",
        "type",
        `
        variable rgb: Color.Rgb;
        rgb.r = 255;
        rgb.g = 128;
        rgb.b = 64;
        
        variable srgb: Color.SRGB = rgb.to.srgb();
        srgb.to.linearsrgb()
      `,
      );

      // ColorJS reference: RGB → sRGB → Linear sRGB
      const colorJS = new Color("srgb", [1, 128 / 255, 64 / 255]).to("srgb-linear");

      expect((result as any).value.r.value).toBeCloseTo(colorJS.coords[0], 9);
      expect((result as any).value.g.value).toBeCloseTo(colorJS.coords[1], 9);
      expect((result as any).value.b.value).toBeCloseTo(colorJS.coords[2], 9);
    });
  });
});
