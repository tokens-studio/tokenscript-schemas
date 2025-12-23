/**
 * OKLab Color Schema Tests
 *
 * Tests for the OKLab perceptually uniform color space
 * Validates against ColorJS for parity
 */

import { log } from "@tests/helpers/logger";
import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

// ColorJS reference tolerance (OKLab is sensitive to precision)
const TOLERANCE = 1e-7;

describe("OKLab Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("oklab-color")) as ColorSpecification;

      expect(schema.name).toBe("OKLab");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("l");
      expect(schema.schema?.properties).toHaveProperty("a");
      expect(schema.schema?.properties).toHaveProperty("b");
      expect(schema.schema?.required).toEqual(["l", "a", "b"]);
    });

    it("should have oklab initializer", async () => {
      const schema = (await getBundledSchema("oklab-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("oklab");
      expect(schema.initializers[0].script.script).toContain("Color.OKLab");
    });

    it("should have conversion from XYZ-D65", async () => {
      const schema = (await getBundledSchema("oklab-color")) as ColorSpecification;

      expect(schema.conversions.length).toBeGreaterThanOrEqual(1);

      const xyzToOklab = schema.conversions.find((c: { source: string }) =>
        c.source.includes("xyz-d65-color"),
      );
      expect(xyzToOklab).toBeDefined();
      expect(xyzToOklab?.lossless).toBe(true);
    });
  });

  describe("Initialization", () => {
    it("should create OKLab color from values", async () => {
      const result = await executeWithSchema(
        "oklab-color",
        "type",
        `
        variable c: Color.OKLab;
        c.l = 0.7;
        c.a = 0.1;
        c.b = -0.1;
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("OKLab");
      expect((result as any).value.l.value).toBeCloseTo(0.7, 10);
      expect((result as any).value.a.value).toBeCloseTo(0.1, 10);
      expect((result as any).value.b.value).toBeCloseTo(-0.1, 10);
    });
  });

  describe("Conversion from XYZ-D65 to OKLab", () => {
    it("should convert XYZ-D65 white to OKLab", async () => {
      // D65 white point XYZ values
      const result = await executeWithSchema(
        "oklab-color",
        "type",
        `
        variable xyz: Color.XYZD65;
        xyz.x = 0.95047;
        xyz.y = 1.0;
        xyz.z = 1.08883;
        xyz.to.oklab()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("xyz-d65", [0.95047, 1.0, 1.08883]).to("oklab");

      log.info(`\n=== D65 WHITE → OKLab ===`);
      log.info(
        `TokenScript: { l: ${(result as any).value.l.value}, a: ${(result as any).value.a.value}, b: ${(result as any).value.b.value} }`,
      );
      log.info(
        `ColorJS:     { l: ${colorJS.coords[0]}, a: ${colorJS.coords[1]}, b: ${colorJS.coords[2]} }`,
      );

      expect((result as any).value.l.value).toBeCloseTo(colorJS.coords[0], 6);
      expect((result as any).value.a.value).toBeCloseTo(colorJS.coords[1], 6);
      expect((result as any).value.b.value).toBeCloseTo(colorJS.coords[2], 6);
    });

    it("should convert red XYZ-D65 to OKLab", async () => {
      // Red in XYZ-D65
      const colorJSRed = new Color("srgb", [1, 0, 0]);
      const redXYZ = colorJSRed.to("xyz-d65");

      const result = await executeWithSchema(
        "oklab-color",
        "type",
        `
        variable xyz: Color.XYZD65;
        xyz.x = ${redXYZ.coords[0]};
        xyz.y = ${redXYZ.coords[1]};
        xyz.z = ${redXYZ.coords[2]};
        xyz.to.oklab()
      `,
      );

      const colorJS = redXYZ.to("oklab");

      log.info(`\n=== RED XYZ → OKLab ===`);
      log.info(
        `TokenScript: { l: ${(result as any).value.l.value}, a: ${(result as any).value.a.value}, b: ${(result as any).value.b.value} }`,
      );
      log.info(
        `ColorJS:     { l: ${colorJS.coords[0]}, a: ${colorJS.coords[1]}, b: ${colorJS.coords[2]} }`,
      );

      expect((result as any).value.l.value).toBeCloseTo(colorJS.coords[0], 6);
      expect((result as any).value.a.value).toBeCloseTo(colorJS.coords[1], 6);
      expect((result as any).value.b.value).toBeCloseTo(colorJS.coords[2], 6);
    });
  });

  describe("Full Conversion Chain: sRGB → Linear sRGB → XYZ-D65 → OKLab", () => {
    it("should convert sRGB red through to OKLab", async () => {
      const result = await executeWithSchema(
        "oklab-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 0;
        srgb.b = 0;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz: Color.XYZD65 = linear.to.xyzd65();
        xyz.to.oklab()
      `,
      );

      // ColorJS reference: sRGB red → OKLab
      const colorJS = new Color("srgb", [1, 0, 0]).to("oklab");

      log.info(`\n=== sRGB RED → OKLab (full chain) ===`);
      log.info(
        `TokenScript: { l: ${(result as any).value.l.value}, a: ${(result as any).value.a.value}, b: ${(result as any).value.b.value} }`,
      );
      log.info(
        `ColorJS:     { l: ${colorJS.coords[0]}, a: ${colorJS.coords[1]}, b: ${colorJS.coords[2]} }`,
      );

      expect((result as any).value.l.value).toBeCloseTo(colorJS.coords[0], 6);
      expect((result as any).value.a.value).toBeCloseTo(colorJS.coords[1], 6);
      expect((result as any).value.b.value).toBeCloseTo(colorJS.coords[2], 6);
    });

    it("should convert sRGB green through to OKLab", async () => {
      const result = await executeWithSchema(
        "oklab-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0;
        srgb.g = 1;
        srgb.b = 0;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz: Color.XYZD65 = linear.to.xyzd65();
        xyz.to.oklab()
      `,
      );

      const colorJS = new Color("srgb", [0, 1, 0]).to("oklab");

      expect((result as any).value.l.value).toBeCloseTo(colorJS.coords[0], 6);
      expect((result as any).value.a.value).toBeCloseTo(colorJS.coords[1], 6);
      expect((result as any).value.b.value).toBeCloseTo(colorJS.coords[2], 6);
    });

    it("should convert sRGB blue through to OKLab", async () => {
      const result = await executeWithSchema(
        "oklab-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0;
        srgb.g = 0;
        srgb.b = 1;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz: Color.XYZD65 = linear.to.xyzd65();
        xyz.to.oklab()
      `,
      );

      const colorJS = new Color("srgb", [0, 0, 1]).to("oklab");

      expect((result as any).value.l.value).toBeCloseTo(colorJS.coords[0], 6);
      expect((result as any).value.a.value).toBeCloseTo(colorJS.coords[1], 6);
      expect((result as any).value.b.value).toBeCloseTo(colorJS.coords[2], 6);
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
      { name: "coral", srgb: [1, 0.341, 0.2] },
      { name: "cyan", srgb: [0, 1, 1] },
      { name: "magenta", srgb: [1, 0, 1] },
      { name: "yellow", srgb: [1, 1, 0] },
    ];

    for (const { name, srgb } of testCases) {
      it(`should match ColorJS for ${name}`, async () => {
        const result = await executeWithSchema(
          "oklab-color",
          "type",
          `
          variable srgb: Color.SRGB;
          srgb.r = ${srgb[0]};
          srgb.g = ${srgb[1]};
          srgb.b = ${srgb[2]};
          
          variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
          variable xyz: Color.XYZD65 = linear.to.xyzd65();
          xyz.to.oklab()
        `,
        );

        // ColorJS reference
        const colorJS = new Color("srgb", srgb as [number, number, number]).to("oklab");

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
          `TokenScript: { l: ${tsL.toFixed(6)}, a: ${tsA.toFixed(6)}, b: ${tsB.toFixed(6)} }`,
        );
        log.info(
          `ColorJS:     { l: ${colorJS.coords[0].toFixed(6)}, a: ${colorJS.coords[1].toFixed(6)}, b: ${colorJS.coords[2].toFixed(6)} }`,
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
        "oklab-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0;
        srgb.g = 0;
        srgb.b = 0;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz: Color.XYZD65 = linear.to.xyzd65();
        xyz.to.oklab()
      `,
      );

      // Black should have L=0 and a=b=0
      expect((result as any).value.l.value).toBeCloseTo(0, 6);
      expect((result as any).value.a.value).toBeCloseTo(0, 6);
      expect((result as any).value.b.value).toBeCloseTo(0, 6);
    });

    it("should handle white (L=1)", async () => {
      const result = await executeWithSchema(
        "oklab-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 1;
        srgb.b = 1;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz: Color.XYZD65 = linear.to.xyzd65();
        xyz.to.oklab()
      `,
      );

      const colorJS = new Color("srgb", [1, 1, 1]).to("oklab");

      // White should have L≈1 and a≈b≈0
      expect((result as any).value.l.value).toBeCloseTo(colorJS.coords[0], 6);
      expect(Math.abs((result as any).value.a.value)).toBeLessThan(1e-5);
      expect(Math.abs((result as any).value.b.value)).toBeLessThan(1e-5);
    });

    it("should handle neutral grays (a=b≈0)", async () => {
      const result = await executeWithSchema(
        "oklab-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0.5;
        srgb.g = 0.5;
        srgb.b = 0.5;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz: Color.XYZD65 = linear.to.xyzd65();
        xyz.to.oklab()
      `,
      );

      // Gray should have a≈0 and b≈0
      expect(Math.abs((result as any).value.a.value)).toBeLessThan(1e-5);
      expect(Math.abs((result as any).value.b.value)).toBeLessThan(1e-5);
    });
  });
});
