/**
 * HSL Color Schema Tests
 *
 * Tests for the HSL color space (Hue, Saturation, Lightness)
 * Validates against ColorJS for parity
 */

import { describe, expect, it } from "vitest";
import Color from "colorjs.io";
import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import type { ColorSpecification } from "@/bundler/types";

// ColorJS reference tolerance
const TOLERANCE = 1e-9;
const HUE_TOLERANCE = 1e-6;

describe("HSL Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("hsl-color")) as ColorSpecification;

      expect(schema.name).toBe("HSL");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("h");
      expect(schema.schema?.properties).toHaveProperty("s");
      expect(schema.schema?.properties).toHaveProperty("l");
      expect(schema.schema?.required).toEqual(["h", "s", "l"]);
    });

    it("should have hsl initializer", async () => {
      const schema = (await getBundledSchema("hsl-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("hsl");
    });

    it("should have conversion from sRGB", async () => {
      const schema = (await getBundledSchema("hsl-color")) as ColorSpecification;

      expect(schema.conversions).toHaveLength(1);

      const srgbToHsl = schema.conversions.find(
        (c: { source: string }) => c.source.includes("srgb-color"),
      );
      expect(srgbToHsl).toBeDefined();
    });
  });

  describe("Conversion from sRGB to HSL", () => {
    it("should convert sRGB red to HSL", async () => {
      const result = await executeWithSchema(
        "hsl-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 0;
        srgb.b = 0;
        srgb.to.hsl()
      `,
      );

      // ColorJS reference (uses 0-100 for S and L, we use 0-1)
      const colorJS = new Color("srgb", [1, 0, 0]).to("hsl");
      const cjS = colorJS.coords[1] / 100;
      const cjL = colorJS.coords[2] / 100;

      console.log(`\n=== sRGB RED → HSL ===`);
      console.log(`TokenScript: { h: ${(result as any).value.h.value}, s: ${(result as any).value.s.value}, l: ${(result as any).value.l.value} }`);
      console.log(`ColorJS:     { h: ${colorJS.coords[0]}, s: ${cjS}, l: ${cjL} } (normalized)`);

      expect((result as any).value.h.value).toBeCloseTo(colorJS.coords[0], 6);
      expect((result as any).value.s.value).toBeCloseTo(cjS, 9);
      expect((result as any).value.l.value).toBeCloseTo(cjL, 9);
    });
  });

  describe("ColorJS Parity", () => {
    const testCases = [
      { name: "red", srgb: [1, 0, 0], expectedH: 0 },
      { name: "green", srgb: [0, 1, 0], expectedH: 120 },
      { name: "blue", srgb: [0, 0, 1], expectedH: 240 },
      { name: "cyan", srgb: [0, 1, 1], expectedH: 180 },
      { name: "magenta", srgb: [1, 0, 1], expectedH: 300 },
      { name: "yellow", srgb: [1, 1, 0], expectedH: 60 },
      { name: "coral", srgb: [1, 0.5, 0.314], expectedH: null },
    ];

    for (const { name, srgb, expectedH } of testCases) {
      it(`should match ColorJS for ${name}`, async () => {
        const result = await executeWithSchema(
          "hsl-color",
          "type",
          `
          variable srgb: Color.SRGB;
          srgb.r = ${srgb[0]};
          srgb.g = ${srgb[1]};
          srgb.b = ${srgb[2]};
          srgb.to.hsl()
        `,
        );

        // ColorJS reference (uses 0-100 for S and L, we use 0-1)
        const colorJS = new Color("srgb", srgb).to("hsl");

        const tsH = (result as any).value.h.value;
        const tsS = (result as any).value.s.value;
        const tsL = (result as any).value.l.value;

        // ColorJS uses 0-100 scale for S and L, convert to 0-1 for comparison
        const cjS = colorJS.coords[1] / 100;
        const cjL = colorJS.coords[2] / 100;

        let diffH = Math.abs(tsH - colorJS.coords[0]);
        if (diffH > 180) diffH = 360 - diffH;
        const diffS = Math.abs(tsS - cjS);
        const diffL = Math.abs(tsL - cjL);
        const maxDiff = Math.max(diffS, diffL);

        console.log(`\n=== ${name.toUpperCase()} ColorJS Parity ===`);
        console.log(`Input sRGB:  { r: ${srgb[0]}, g: ${srgb[1]}, b: ${srgb[2]} }`);
        console.log(`TokenScript: { h: ${tsH.toFixed(3)}, s: ${tsS.toFixed(6)}, l: ${tsL.toFixed(6)} }`);
        console.log(`ColorJS:     { h: ${colorJS.coords[0].toFixed(3)}, s: ${cjS.toFixed(6)}, l: ${cjL.toFixed(6)} } (normalized from 0-100)`);
        console.log(`Max Diff (S,L): ${maxDiff.toExponential(2)}`);
        console.log(`Hue Diff:       ${diffH.toExponential(2)}`);
        console.log(`Status:         ${maxDiff < TOLERANCE && diffH < HUE_TOLERANCE ? "✅ PASS" : "❌ FAIL"}`);

        expect(maxDiff).toBeLessThan(TOLERANCE);
        expect(diffH).toBeLessThan(HUE_TOLERANCE);
        
        // For primary colors, also check expected hue
        if (expectedH !== null) {
          expect(tsH).toBeCloseTo(expectedH, 5);
        }
      });
    }
  });

  describe("Edge Cases", () => {
    it("should handle white (S=0)", async () => {
      const result = await executeWithSchema(
        "hsl-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 1;
        srgb.b = 1;
        srgb.to.hsl()
      `,
      );

      expect((result as any).value.s.value).toBeCloseTo(0, 9);
      expect((result as any).value.l.value).toBeCloseTo(1, 9);
    });

    it("should handle black (S=0, L=0)", async () => {
      const result = await executeWithSchema(
        "hsl-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0;
        srgb.g = 0;
        srgb.b = 0;
        srgb.to.hsl()
      `,
      );

      expect((result as any).value.s.value).toBeCloseTo(0, 9);
      expect((result as any).value.l.value).toBeCloseTo(0, 9);
    });

    it("should handle gray (S=0)", async () => {
      const result = await executeWithSchema(
        "hsl-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0.5;
        srgb.g = 0.5;
        srgb.b = 0.5;
        srgb.to.hsl()
      `,
      );

      expect((result as any).value.s.value).toBeCloseTo(0, 9);
      expect((result as any).value.l.value).toBeCloseTo(0.5, 9);
    });
  });
});

