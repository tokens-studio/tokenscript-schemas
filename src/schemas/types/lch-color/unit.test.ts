/**
 * CIE LCH Color Schema Tests
 *
 * Tests for the CIE LCH color space (polar form of Lab)
 * Validates against ColorJS for parity
 */

import { log } from "@tests/helpers/logger";
import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

// ColorJS reference tolerance
const TOLERANCE = 1e-6;
const HUE_TOLERANCE = 1e-3;

describe("CIE LCH Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("lch-color")) as ColorSpecification;

      expect(schema.name).toBe("LCH");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("l");
      expect(schema.schema?.properties).toHaveProperty("c");
      expect(schema.schema?.properties).toHaveProperty("h");
      expect(schema.schema?.required).toEqual(["l", "c", "h"]);
    });

    it("should have lch initializer", async () => {
      const schema = (await getBundledSchema("lch-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("lch");
    });

    it("should have conversion from Lab", async () => {
      const schema = (await getBundledSchema("lch-color")) as ColorSpecification;

      expect(schema.conversions).toHaveLength(1);

      const labToLch = schema.conversions.find((c: { source: string }) =>
        c.source.includes("lab-color"),
      );
      expect(labToLch).toBeDefined();
    });
  });

  describe("Full Conversion Chain: sRGB → ... → Lab → LCH", () => {
    it("should convert sRGB red through to LCH", async () => {
      const result = await executeWithSchema(
        "lch-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 0;
        srgb.b = 0;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz65: Color.XYZD65 = linear.to.xyzd65();
        variable xyz50: Color.XYZD50 = xyz65.to.xyzd50();
        variable lab: Color.Lab = xyz50.to.lab();
        lab.to.lch()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("srgb", [1, 0, 0]).to("lch");

      log.info(`\n=== sRGB RED → LCH (full chain) ===`);
      log.info(
        `TokenScript: { l: ${(result as any).value.l.value}, c: ${(result as any).value.c.value}, h: ${(result as any).value.h.value} }`,
      );
      log.info(
        `ColorJS:     { l: ${colorJS.coords[0]}, c: ${colorJS.coords[1]}, h: ${colorJS.coords[2]} }`,
      );

      expect((result as any).value.l.value).toBeCloseTo(colorJS.coords[0], 5);
      expect((result as any).value.c.value).toBeCloseTo(colorJS.coords[1], 5);
      expect((result as any).value.h.value).toBeCloseTo(colorJS.coords[2], 1);
    });
  });

  describe("ColorJS Parity", () => {
    const testCases = [
      { name: "red", srgb: [1, 0, 0] },
      { name: "green", srgb: [0, 1, 0] },
      { name: "blue", srgb: [0, 0, 1] },
      { name: "cyan", srgb: [0, 1, 1] },
      { name: "magenta", srgb: [1, 0, 1] },
      { name: "yellow", srgb: [1, 1, 0] },
    ];

    for (const { name, srgb } of testCases) {
      it(`should match ColorJS for ${name}`, async () => {
        const result = await executeWithSchema(
          "lch-color",
          "type",
          `
          variable srgb: Color.SRGB;
          srgb.r = ${srgb[0]};
          srgb.g = ${srgb[1]};
          srgb.b = ${srgb[2]};
          
          variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
          variable xyz65: Color.XYZD65 = linear.to.xyzd65();
          variable xyz50: Color.XYZD50 = xyz65.to.xyzd50();
          variable lab: Color.Lab = xyz50.to.lab();
          lab.to.lch()
        `,
        );

        // ColorJS reference
        const colorJS = new Color("srgb", srgb as [number, number, number]).to("lch");

        const tsL = (result as any).value.l.value;
        const tsC = (result as any).value.c.value;
        const tsH = (result as any).value.h.value;

        const diffL = Math.abs(tsL - colorJS.coords[0]);
        const diffC = Math.abs(tsC - colorJS.coords[1]);
        let diffH = Math.abs(tsH - colorJS.coords[2]);
        if (diffH > 180) diffH = 360 - diffH;

        const maxDiff = Math.max(diffL, diffC);

        log.info(`\n=== ${name.toUpperCase()} ColorJS Parity ===`);
        log.info(`Input sRGB:  { r: ${srgb[0]}, g: ${srgb[1]}, b: ${srgb[2]} }`);
        log.info(
          `TokenScript: { l: ${tsL.toFixed(4)}, c: ${tsC.toFixed(4)}, h: ${tsH.toFixed(3)} }`,
        );
        log.info(
          `ColorJS:     { l: ${colorJS.coords[0].toFixed(4)}, c: ${colorJS.coords[1].toFixed(4)}, h: ${colorJS.coords[2].toFixed(3)} }`,
        );
        log.info(`Max Diff (L,C): ${maxDiff.toExponential(2)}`);
        log.info(`Hue Diff:       ${diffH.toExponential(2)}`);
        log.info(
          `Status:         ${maxDiff < TOLERANCE && diffH < HUE_TOLERANCE ? "✅ PASS" : "❌ FAIL"}`,
        );

        expect(maxDiff).toBeLessThan(TOLERANCE);
        expect(diffH).toBeLessThan(HUE_TOLERANCE);
      });
    }
  });

  describe("Edge Cases", () => {
    it("should handle neutral gray (chroma ≈ 0)", async () => {
      const result = await executeWithSchema(
        "lch-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0.5;
        srgb.g = 0.5;
        srgb.b = 0.5;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz65: Color.XYZD65 = linear.to.xyzd65();
        variable xyz50: Color.XYZD50 = xyz65.to.xyzd50();
        variable lab: Color.Lab = xyz50.to.lab();
        lab.to.lch()
      `,
      );

      // Gray should have chroma ≈ 0
      expect((result as any).value.c.value).toBeLessThan(0.01);
    });
  });
});
