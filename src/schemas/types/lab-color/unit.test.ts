/**
 * CIE Lab Color Schema Tests
 *
 * Tests for the CIE Lab perceptually uniform color space
 * Validates against ColorJS for parity
 */

import { log } from "@tests/helpers/logger";
import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

// ColorJS reference tolerance
const TOLERANCE = 1e-7;

describe("CIE Lab Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("lab-color")) as ColorSpecification;

      expect(schema.name).toBe("Lab");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("l");
      expect(schema.schema?.properties).toHaveProperty("a");
      expect(schema.schema?.properties).toHaveProperty("b");
      expect(schema.schema?.required).toEqual(["l", "a", "b"]);
    });

    it("should have lab initializer", async () => {
      const schema = (await getBundledSchema("lab-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("lab");
    });

    it("should have conversion from XYZ-D50", async () => {
      const schema = (await getBundledSchema("lab-color")) as ColorSpecification;

      expect(schema.conversions).toHaveLength(1);

      const xyzToLab = schema.conversions.find((c: { source: string }) =>
        c.source.includes("xyz-d50-color"),
      );
      expect(xyzToLab).toBeDefined();
      expect(xyzToLab?.lossless).toBe(true);
    });
  });

  describe("Initialization", () => {
    it("should create Lab color from values", async () => {
      const result = await executeWithSchema(
        "lab-color",
        "type",
        `
        variable c: Color.Lab;
        c.l = 50;
        c.a = 25;
        c.b = -10;
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Lab");
      expect((result as any).value.l.value).toBeCloseTo(50, 10);
      expect((result as any).value.a.value).toBeCloseTo(25, 10);
      expect((result as any).value.b.value).toBeCloseTo(-10, 10);
    });
  });

  describe("Conversion from XYZ-D50 to Lab", () => {
    it("should convert D50 white to Lab (L=100)", async () => {
      // D50 white point
      const result = await executeWithSchema(
        "lab-color",
        "type",
        `
        variable xyz: Color.XYZD50;
        xyz.x = 0.96429567;
        xyz.y = 1.0;
        xyz.z = 0.82510460;
        xyz.to.lab()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("xyz-d50", [0.96429567, 1.0, 0.8251046]).to("lab");

      log.info(`\n=== D50 WHITE → Lab ===`);
      log.info(
        `TokenScript: { l: ${(result as any).value.l.value}, a: ${(result as any).value.a.value}, b: ${(result as any).value.b.value} }`,
      );
      log.info(
        `ColorJS:     { l: ${colorJS.coords[0]}, a: ${colorJS.coords[1]}, b: ${colorJS.coords[2]} }`,
      );

      // White should have L≈100 and a≈b≈0
      expect((result as any).value.l.value).toBeCloseTo(colorJS.coords[0], 5);
      expect((result as any).value.a.value).toBeCloseTo(colorJS.coords[1], 5);
      expect((result as any).value.b.value).toBeCloseTo(colorJS.coords[2], 5);
    });
  });

  describe("Full Conversion Chain: sRGB → ... → XYZ-D50 → Lab", () => {
    it("should convert sRGB red through to Lab", async () => {
      const result = await executeWithSchema(
        "lab-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 0;
        srgb.b = 0;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz65: Color.XYZD65 = linear.to.xyzd65();
        variable xyz50: Color.XYZD50 = xyz65.to.xyzd50();
        xyz50.to.lab()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("srgb", [1, 0, 0]).to("lab");

      log.info(`\n=== sRGB RED → Lab (full chain) ===`);
      log.info(
        `TokenScript: { l: ${(result as any).value.l.value}, a: ${(result as any).value.a.value}, b: ${(result as any).value.b.value} }`,
      );
      log.info(
        `ColorJS:     { l: ${colorJS.coords[0]}, a: ${colorJS.coords[1]}, b: ${colorJS.coords[2]} }`,
      );

      expect((result as any).value.l.value).toBeCloseTo(colorJS.coords[0], 5);
      expect((result as any).value.a.value).toBeCloseTo(colorJS.coords[1], 5);
      expect((result as any).value.b.value).toBeCloseTo(colorJS.coords[2], 5);
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
          "lab-color",
          "type",
          `
          variable srgb: Color.SRGB;
          srgb.r = ${srgb[0]};
          srgb.g = ${srgb[1]};
          srgb.b = ${srgb[2]};
          
          variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
          variable xyz65: Color.XYZD65 = linear.to.xyzd65();
          variable xyz50: Color.XYZD50 = xyz65.to.xyzd50();
          xyz50.to.lab()
        `,
        );

        // ColorJS reference
        const colorJS = new Color("srgb", srgb as [number, number, number]).to("lab");

        const tsL = (result as any).value.l.value;
        const tsA = (result as any).value.a.value;
        const tsB = (result as any).value.b.value;

        const diffL = Math.abs(tsL - colorJS.coords[0]);
        const diffA = Math.abs(tsA - colorJS.coords[1]);
        const diffB = Math.abs(tsB - colorJS.coords[2]);
        const maxDiff = Math.max(diffL, diffA, diffB);

        log.info(`\n=== ${name.toUpperCase()} ColorJS Parity ===`);
        log.info(`Input sRGB:  { r: ${srgb[0]}, g: ${srgb[1]}, b: ${srgb[2]} }`);
        log.info(
          `TokenScript: { l: ${tsL.toFixed(4)}, a: ${tsA.toFixed(4)}, b: ${tsB.toFixed(4)} }`,
        );
        log.info(
          `ColorJS:     { l: ${colorJS.coords[0].toFixed(4)}, a: ${colorJS.coords[1].toFixed(4)}, b: ${colorJS.coords[2].toFixed(4)} }`,
        );
        log.info(`Max Diff:    ${maxDiff.toExponential(2)}`);
        log.info(`Status:      ${maxDiff < TOLERANCE ? "✅ PASS" : "❌ FAIL"}`);

        expect(maxDiff).toBeLessThan(TOLERANCE);
      });
    }
  });

  describe("Edge Cases", () => {
    it("should handle black (L=0)", async () => {
      const result = await executeWithSchema(
        "lab-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0;
        srgb.g = 0;
        srgb.b = 0;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz65: Color.XYZD65 = linear.to.xyzd65();
        variable xyz50: Color.XYZD50 = xyz65.to.xyzd50();
        xyz50.to.lab()
      `,
      );

      expect((result as any).value.l.value).toBeCloseTo(0, 5);
    });

    it("should handle white (L=100)", async () => {
      const result = await executeWithSchema(
        "lab-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 1;
        srgb.b = 1;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz65: Color.XYZD65 = linear.to.xyzd65();
        variable xyz50: Color.XYZD50 = xyz65.to.xyzd50();
        xyz50.to.lab()
      `,
      );

      expect((result as any).value.l.value).toBeCloseTo(100, 4);
    });

    it("should handle neutral gray (a≈0, b≈0)", async () => {
      const result = await executeWithSchema(
        "lab-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0.5;
        srgb.g = 0.5;
        srgb.b = 0.5;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz65: Color.XYZD65 = linear.to.xyzd65();
        variable xyz50: Color.XYZD50 = xyz65.to.xyzd50();
        xyz50.to.lab()
      `,
      );

      // Gray should have a≈0 and b≈0
      expect(Math.abs((result as any).value.a.value)).toBeLessThan(0.01);
      expect(Math.abs((result as any).value.b.value)).toBeLessThan(0.01);
    });
  });
});
