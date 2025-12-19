/**
 * XYZ-D65 Color Schema Tests
 *
 * Tests for the CIE XYZ-D65 color space (the connection hub)
 * Validates against ColorJS for parity
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

// ColorJS reference tolerance
const TOLERANCE = 1e-9;

describe("XYZ-D65 Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("xyz-d65-color")) as ColorSpecification;

      expect(schema.name).toBe("XYZD65");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("x");
      expect(schema.schema?.properties).toHaveProperty("y");
      expect(schema.schema?.properties).toHaveProperty("z");
      expect(schema.schema?.required).toEqual(["x", "y", "z"]);
    });

    it("should have xyzd65 initializer", async () => {
      const schema = (await getBundledSchema("xyz-d65-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("xyzd65");
      expect(schema.initializers[0].script.script).toContain("Color.XYZD65");
    });

    it("should have conversions from Linear sRGB and Linear P3", async () => {
      const schema = (await getBundledSchema("xyz-d65-color")) as ColorSpecification;

      expect(schema.conversions.length).toBeGreaterThanOrEqual(2);

      const linearSrgbToXyz = schema.conversions.find((c: { source: string }) =>
        c.source.includes("srgb-linear-color"),
      );
      expect(linearSrgbToXyz).toBeDefined();
      expect(linearSrgbToXyz?.lossless).toBe(true);

      const linearP3ToXyz = schema.conversions.find((c: { source: string }) =>
        c.source.includes("p3-linear-color"),
      );
      expect(linearP3ToXyz).toBeDefined();
      expect(linearP3ToXyz?.lossless).toBe(true);
    });
  });

  describe("Initialization", () => {
    it("should create XYZ-D65 color from values", async () => {
      const result = await executeWithSchema(
        "xyz-d65-color",
        "type",
        `
        variable c: Color.XYZD65;
        c.x = 0.5;
        c.y = 0.4;
        c.z = 0.3;
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("XYZD65");
      expect((result as any).value.x.value).toBeCloseTo(0.5, 10);
      expect((result as any).value.y.value).toBeCloseTo(0.4, 10);
      expect((result as any).value.z.value).toBeCloseTo(0.3, 10);
    });
  });

  describe("Conversion from Linear sRGB to XYZ-D65", () => {
    it("should convert linear red to XYZ-D65", async () => {
      const result = await executeWithSchema(
        "xyz-d65-color",
        "type",
        `
        variable linear: Color.LinearSRGB;
        linear.r = 1;
        linear.g = 0;
        linear.b = 0;
        linear.to.xyzd65()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("srgb-linear", [1, 0, 0]).to("xyz-d65");

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("XYZD65");
      expect((result as any).value.x.value).toBeCloseTo(colorJS.coords[0], 9);
      expect((result as any).value.y.value).toBeCloseTo(colorJS.coords[1], 9);
      expect((result as any).value.z.value).toBeCloseTo(colorJS.coords[2], 9);
    });

    it("should convert linear green to XYZ-D65", async () => {
      const result = await executeWithSchema(
        "xyz-d65-color",
        "type",
        `
        variable linear: Color.LinearSRGB;
        linear.r = 0;
        linear.g = 1;
        linear.b = 0;
        linear.to.xyzd65()
      `,
      );

      const colorJS = new Color("srgb-linear", [0, 1, 0]).to("xyz-d65");

      expect((result as any).value.x.value).toBeCloseTo(colorJS.coords[0], 9);
      expect((result as any).value.y.value).toBeCloseTo(colorJS.coords[1], 9);
      expect((result as any).value.z.value).toBeCloseTo(colorJS.coords[2], 9);
    });

    it("should convert linear blue to XYZ-D65", async () => {
      const result = await executeWithSchema(
        "xyz-d65-color",
        "type",
        `
        variable linear: Color.LinearSRGB;
        linear.r = 0;
        linear.g = 0;
        linear.b = 1;
        linear.to.xyzd65()
      `,
      );

      const colorJS = new Color("srgb-linear", [0, 0, 1]).to("xyz-d65");

      expect((result as any).value.x.value).toBeCloseTo(colorJS.coords[0], 9);
      expect((result as any).value.y.value).toBeCloseTo(colorJS.coords[1], 9);
      expect((result as any).value.z.value).toBeCloseTo(colorJS.coords[2], 9);
    });

    it("should convert linear white to XYZ-D65 (D65 white point)", async () => {
      const result = await executeWithSchema(
        "xyz-d65-color",
        "type",
        `
        variable linear: Color.LinearSRGB;
        linear.r = 1;
        linear.g = 1;
        linear.b = 1;
        linear.to.xyzd65()
      `,
      );

      const colorJS = new Color("srgb-linear", [1, 1, 1]).to("xyz-d65");

      // D65 white point should sum the matrix rows
      console.log(`\n=== D65 WHITE POINT ===`);
      console.log(
        `TokenScript: { x: ${(result as any).value.x.value}, y: ${(result as any).value.y.value}, z: ${(result as any).value.z.value} }`,
      );
      console.log(
        `ColorJS:     { x: ${colorJS.coords[0]}, y: ${colorJS.coords[1]}, z: ${colorJS.coords[2]} }`,
      );

      expect((result as any).value.x.value).toBeCloseTo(colorJS.coords[0], 9);
      expect((result as any).value.y.value).toBeCloseTo(colorJS.coords[1], 9);
      expect((result as any).value.z.value).toBeCloseTo(colorJS.coords[2], 9);
    });
  });

  describe("ColorJS Parity", () => {
    const testCases = [
      { name: "red", linear: [1, 0, 0] },
      { name: "green", linear: [0, 1, 0] },
      { name: "blue", linear: [0, 0, 1] },
      { name: "black", linear: [0, 0, 0] },
      { name: "white", linear: [1, 1, 1] },
      { name: "gray-21.4%", linear: [0.214, 0.214, 0.214] }, // sRGB 50% gray
      { name: "coral-linear", linear: [1, 0.095, 0.033] },
      { name: "cyan", linear: [0, 1, 1] },
      { name: "magenta", linear: [1, 0, 1] },
      { name: "yellow", linear: [1, 1, 0] },
    ];

    for (const { name, linear } of testCases) {
      it(`should match ColorJS for ${name}`, async () => {
        const result = await executeWithSchema(
          "xyz-d65-color",
          "type",
          `
          variable linear: Color.LinearSRGB;
          linear.r = ${linear[0]};
          linear.g = ${linear[1]};
          linear.b = ${linear[2]};
          linear.to.xyzd65()
        `,
        );

        // ColorJS reference
        const colorJS = new Color("srgb-linear", linear as [number, number, number]).to("xyz-d65");

        const tsX = (result as any).value.x.value;
        const tsY = (result as any).value.y.value;
        const tsZ = (result as any).value.z.value;

        const diffX = Math.abs(tsX - colorJS.coords[0]);
        const diffY = Math.abs(tsY - colorJS.coords[1]);
        const diffZ = Math.abs(tsZ - colorJS.coords[2]);
        const maxDiff = Math.max(diffX, diffY, diffZ);

        console.log(`\n=== ${name.toUpperCase()} ColorJS Parity ===`);
        console.log(`Input Linear: { r: ${linear[0]}, g: ${linear[1]}, b: ${linear[2]} }`);
        console.log(
          `TokenScript:  { x: ${tsX.toFixed(9)}, y: ${tsY.toFixed(9)}, z: ${tsZ.toFixed(9)} }`,
        );
        console.log(
          `ColorJS:      { x: ${colorJS.coords[0].toFixed(9)}, y: ${colorJS.coords[1].toFixed(9)}, z: ${colorJS.coords[2].toFixed(9)} }`,
        );
        console.log(`Max Diff:     ${maxDiff.toExponential(2)}`);
        console.log(`Status:       ${maxDiff < TOLERANCE ? "✅ PASS" : "❌ FAIL"}`);

        expect(maxDiff).toBeLessThan(TOLERANCE);
      });
    }
  });

  describe("Full Conversion Chain: sRGB → Linear sRGB → XYZ-D65", () => {
    it("should convert sRGB red through to XYZ-D65", async () => {
      const result = await executeWithSchema(
        "xyz-d65-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 0;
        srgb.b = 0;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        linear.to.xyzd65()
      `,
      );

      // ColorJS reference: sRGB → XYZ-D65
      const colorJS = new Color("srgb", [1, 0, 0]).to("xyz-d65");

      expect((result as any).value.x.value).toBeCloseTo(colorJS.coords[0], 9);
      expect((result as any).value.y.value).toBeCloseTo(colorJS.coords[1], 9);
      expect((result as any).value.z.value).toBeCloseTo(colorJS.coords[2], 9);
    });

    it("should convert sRGB mid-gray through to XYZ-D65", async () => {
      const result = await executeWithSchema(
        "xyz-d65-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0.5;
        srgb.g = 0.5;
        srgb.b = 0.5;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        linear.to.xyzd65()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("srgb", [0.5, 0.5, 0.5]).to("xyz-d65");

      console.log(`\n=== sRGB 50% GRAY → XYZ-D65 (full chain) ===`);
      console.log(
        `TokenScript: { x: ${(result as any).value.x.value}, y: ${(result as any).value.y.value}, z: ${(result as any).value.z.value} }`,
      );
      console.log(
        `ColorJS:     { x: ${colorJS.coords[0]}, y: ${colorJS.coords[1]}, z: ${colorJS.coords[2]} }`,
      );

      expect((result as any).value.x.value).toBeCloseTo(colorJS.coords[0], 9);
      expect((result as any).value.y.value).toBeCloseTo(colorJS.coords[1], 9);
      expect((result as any).value.z.value).toBeCloseTo(colorJS.coords[2], 9);
    });
  });

  describe("Full Conversion Chain: RGB (0-255) → sRGB → Linear sRGB → XYZ-D65", () => {
    it("should convert RGB #ff5733 through entire chain to XYZ-D65", async () => {
      const result = await executeWithSchema(
        "xyz-d65-color",
        "type",
        `
        variable rgb: Color.Rgb;
        rgb.r = 255;
        rgb.g = 87;
        rgb.b = 51;
        
        variable srgb: Color.SRGB = rgb.to.srgb();
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        linear.to.xyzd65()
      `,
      );

      // ColorJS reference: #ff5733 → XYZ-D65
      const colorJS = new Color("#ff5733").to("xyz-d65");

      console.log(`\n=== RGB #ff5733 → XYZ-D65 (full chain) ===`);
      console.log(
        `TokenScript: { x: ${(result as any).value.x.value}, y: ${(result as any).value.y.value}, z: ${(result as any).value.z.value} }`,
      );
      console.log(
        `ColorJS:     { x: ${colorJS.coords[0]}, y: ${colorJS.coords[1]}, z: ${colorJS.coords[2]} }`,
      );

      expect((result as any).value.x.value).toBeCloseTo(colorJS.coords[0], 8);
      expect((result as any).value.y.value).toBeCloseTo(colorJS.coords[1], 8);
      expect((result as any).value.z.value).toBeCloseTo(colorJS.coords[2], 8);
    });
  });
});
