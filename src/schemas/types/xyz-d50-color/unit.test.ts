/**
 * XYZ-D50 Color Schema Tests
 *
 * Tests for the CIE XYZ-D50 color space (D50 white point)
 * Validates against ColorJS for parity
 */

import { describe, expect, it } from "vitest";
import Color from "colorjs.io";
import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import type { ColorSpecification } from "@/bundler/types";

// ColorJS reference tolerance
const TOLERANCE = 1e-9;

describe("XYZ-D50 Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("xyz-d50-color")) as ColorSpecification;

      expect(schema.name).toBe("XYZD50");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("x");
      expect(schema.schema?.properties).toHaveProperty("y");
      expect(schema.schema?.properties).toHaveProperty("z");
      expect(schema.schema?.required).toEqual(["x", "y", "z"]);
    });

    it("should have xyzd50 initializer", async () => {
      const schema = (await getBundledSchema("xyz-d50-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("xyzd50");
    });

    it("should have conversion from XYZ-D65", async () => {
      const schema = (await getBundledSchema("xyz-d50-color")) as ColorSpecification;

      expect(schema.conversions).toHaveLength(1);

      const d65ToD50 = schema.conversions.find(
        (c: { source: string }) => c.source.includes("xyz-d65-color"),
      );
      expect(d65ToD50).toBeDefined();
      expect(d65ToD50?.lossless).toBe(true);
    });
  });

  describe("Initialization", () => {
    it("should create XYZ-D50 color from values", async () => {
      const result = await executeWithSchema(
        "xyz-d50-color",
        "type",
        `
        variable c: Color.XYZD50;
        c.x = 0.5;
        c.y = 0.4;
        c.z = 0.3;
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("XYZD50");
      expect((result as any).value.x.value).toBeCloseTo(0.5, 10);
      expect((result as any).value.y.value).toBeCloseTo(0.4, 10);
      expect((result as any).value.z.value).toBeCloseTo(0.3, 10);
    });
  });

  describe("Chromatic Adaptation: XYZ-D65 to XYZ-D50", () => {
    it("should convert D65 white point to D50 white point", async () => {
      // D65 white point
      const result = await executeWithSchema(
        "xyz-d50-color",
        "type",
        `
        variable xyz65: Color.XYZD65;
        xyz65.x = 0.95047;
        xyz65.y = 1.0;
        xyz65.z = 1.08883;
        xyz65.to.xyzd50()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("xyz-d65", [0.95047, 1.0, 1.08883]).to("xyz-d50");

      console.log(`\n=== D65 White → D50 ===`);
      console.log(`Input D65:   { x: 0.95047, y: 1.0, z: 1.08883 }`);
      console.log(`TokenScript: { x: ${(result as any).value.x.value}, y: ${(result as any).value.y.value}, z: ${(result as any).value.z.value} }`);
      console.log(`ColorJS:     { x: ${colorJS.coords[0]}, y: ${colorJS.coords[1]}, z: ${colorJS.coords[2]} }`);

      expect((result as any).value.x.value).toBeCloseTo(colorJS.coords[0], 9);
      expect((result as any).value.y.value).toBeCloseTo(colorJS.coords[1], 9);
      expect((result as any).value.z.value).toBeCloseTo(colorJS.coords[2], 9);
    });

    it("should convert red XYZ-D65 to XYZ-D50", async () => {
      // Red in XYZ-D65
      const colorJSRed = new Color("srgb", [1, 0, 0]).to("xyz-d65");

      const result = await executeWithSchema(
        "xyz-d50-color",
        "type",
        `
        variable xyz65: Color.XYZD65;
        xyz65.x = ${colorJSRed.coords[0]};
        xyz65.y = ${colorJSRed.coords[1]};
        xyz65.z = ${colorJSRed.coords[2]};
        xyz65.to.xyzd50()
      `,
      );

      const colorJS = new Color("srgb", [1, 0, 0]).to("xyz-d50");

      expect((result as any).value.x.value).toBeCloseTo(colorJS.coords[0], 9);
      expect((result as any).value.y.value).toBeCloseTo(colorJS.coords[1], 9);
      expect((result as any).value.z.value).toBeCloseTo(colorJS.coords[2], 9);
    });
  });

  describe("Full Conversion Chain: sRGB → Linear → XYZ-D65 → XYZ-D50", () => {
    it("should convert sRGB red through to XYZ-D50", async () => {
      const result = await executeWithSchema(
        "xyz-d50-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 0;
        srgb.b = 0;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz65: Color.XYZD65 = linear.to.xyzd65();
        xyz65.to.xyzd50()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("srgb", [1, 0, 0]).to("xyz-d50");

      console.log(`\n=== sRGB RED → XYZ-D50 (full chain) ===`);
      console.log(`TokenScript: { x: ${(result as any).value.x.value}, y: ${(result as any).value.y.value}, z: ${(result as any).value.z.value} }`);
      console.log(`ColorJS:     { x: ${colorJS.coords[0]}, y: ${colorJS.coords[1]}, z: ${colorJS.coords[2]} }`);

      expect((result as any).value.x.value).toBeCloseTo(colorJS.coords[0], 9);
      expect((result as any).value.y.value).toBeCloseTo(colorJS.coords[1], 9);
      expect((result as any).value.z.value).toBeCloseTo(colorJS.coords[2], 9);
    });
  });

  describe("ColorJS Parity", () => {
    const testCases = [
      { name: "red", srgb: [1, 0, 0] },
      { name: "green", srgb: [0, 1, 0] },
      { name: "blue", srgb: [0, 0, 1] },
      { name: "white", srgb: [1, 1, 1] },
      { name: "black", srgb: [0, 0, 0] },
      { name: "gray-50%", srgb: [0.5, 0.5, 0.5] },
      { name: "cyan", srgb: [0, 1, 1] },
      { name: "magenta", srgb: [1, 0, 1] },
      { name: "yellow", srgb: [1, 1, 0] },
    ];

    for (const { name, srgb } of testCases) {
      it(`should match ColorJS for ${name}`, async () => {
        const result = await executeWithSchema(
          "xyz-d50-color",
          "type",
          `
          variable srgb: Color.SRGB;
          srgb.r = ${srgb[0]};
          srgb.g = ${srgb[1]};
          srgb.b = ${srgb[2]};
          
          variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
          variable xyz65: Color.XYZD65 = linear.to.xyzd65();
          xyz65.to.xyzd50()
        `,
        );

        // ColorJS reference
        const colorJS = new Color("srgb", srgb).to("xyz-d50");

        const tsX = (result as any).value.x.value;
        const tsY = (result as any).value.y.value;
        const tsZ = (result as any).value.z.value;

        const diffX = Math.abs(tsX - colorJS.coords[0]);
        const diffY = Math.abs(tsY - colorJS.coords[1]);
        const diffZ = Math.abs(tsZ - colorJS.coords[2]);
        const maxDiff = Math.max(diffX, diffY, diffZ);

        console.log(`\n=== ${name.toUpperCase()} ColorJS Parity ===`);
        console.log(`Input sRGB:  { r: ${srgb[0]}, g: ${srgb[1]}, b: ${srgb[2]} }`);
        console.log(`TokenScript: { x: ${tsX.toFixed(9)}, y: ${tsY.toFixed(9)}, z: ${tsZ.toFixed(9)} }`);
        console.log(`ColorJS:     { x: ${colorJS.coords[0].toFixed(9)}, y: ${colorJS.coords[1].toFixed(9)}, z: ${colorJS.coords[2].toFixed(9)} }`);
        console.log(`Max Diff:    ${maxDiff.toExponential(2)}`);
        console.log(`Status:      ${maxDiff < TOLERANCE ? "✅ PASS" : "❌ FAIL"}`);

        expect(maxDiff).toBeLessThan(TOLERANCE);
      });
    }
  });

  describe("Edge Cases", () => {
    it("should handle black (0, 0, 0)", async () => {
      const result = await executeWithSchema(
        "xyz-d50-color",
        "type",
        `
        variable xyz65: Color.XYZD65;
        xyz65.x = 0;
        xyz65.y = 0;
        xyz65.z = 0;
        xyz65.to.xyzd50()
      `,
      );

      expect((result as any).value.x.value).toBe(0);
      expect((result as any).value.y.value).toBe(0);
      expect((result as any).value.z.value).toBe(0);
    });
  });
});


