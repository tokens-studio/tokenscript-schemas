/**
 * HSV Color Schema Tests
 *
 * Tests for the HSV color space (Hue, Saturation, Value)
 * Validates against ColorJS for parity
 */

import { describe, expect, it } from "vitest";
import Color from "colorjs.io";
import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import type { ColorSpecification } from "@/bundler/types";

// ColorJS reference tolerance
const TOLERANCE = 1e-9;
const HUE_TOLERANCE = 1e-6;

describe("HSV Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("hsv-color")) as ColorSpecification;

      expect(schema.name).toBe("HSV");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("h");
      expect(schema.schema?.properties).toHaveProperty("s");
      expect(schema.schema?.properties).toHaveProperty("v");
      expect(schema.schema?.required).toEqual(["h", "s", "v"]);
    });

    it("should have hsv initializer", async () => {
      const schema = (await getBundledSchema("hsv-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("hsv");
    });

    it("should have conversion from sRGB", async () => {
      const schema = (await getBundledSchema("hsv-color")) as ColorSpecification;

      expect(schema.conversions).toHaveLength(1);
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
          "hsv-color",
          "type",
          `
          variable srgb: Color.SRGB;
          srgb.r = ${srgb[0]};
          srgb.g = ${srgb[1]};
          srgb.b = ${srgb[2]};
          srgb.to.hsv()
        `,
        );

        // ColorJS reference (uses 0-100 for S and V, we use 0-1)
        const colorJS = new Color("srgb", srgb).to("hsv");
        const cjS = colorJS.coords[1] / 100;
        const cjV = colorJS.coords[2] / 100;

        const tsH = (result as any).value.h.value;
        const tsS = (result as any).value.s.value;
        const tsV = (result as any).value.v.value;

        let diffH = Math.abs(tsH - colorJS.coords[0]);
        if (diffH > 180) diffH = 360 - diffH;
        const diffS = Math.abs(tsS - cjS);
        const diffV = Math.abs(tsV - cjV);
        const maxDiff = Math.max(diffS, diffV);

        console.log(`\n=== ${name.toUpperCase()} ColorJS Parity ===`);
        console.log(`Input sRGB:  { r: ${srgb[0]}, g: ${srgb[1]}, b: ${srgb[2]} }`);
        console.log(`TokenScript: { h: ${tsH.toFixed(3)}, s: ${tsS.toFixed(6)}, v: ${tsV.toFixed(6)} }`);
        console.log(`ColorJS:     { h: ${colorJS.coords[0].toFixed(3)}, s: ${cjS.toFixed(6)}, v: ${cjV.toFixed(6)} } (normalized)`);
        console.log(`Max Diff (S,V): ${maxDiff.toExponential(2)}`);
        console.log(`Hue Diff:       ${diffH.toExponential(2)}`);
        console.log(`Status:         ${maxDiff < TOLERANCE && diffH < HUE_TOLERANCE ? "✅ PASS" : "❌ FAIL"}`);

        expect(maxDiff).toBeLessThan(TOLERANCE);
        expect(diffH).toBeLessThan(HUE_TOLERANCE);
        
        if (expectedH !== null) {
          expect(tsH).toBeCloseTo(expectedH, 5);
        }
      });
    }
  });

  describe("Edge Cases", () => {
    it("should handle white (S=0, V=1)", async () => {
      const result = await executeWithSchema(
        "hsv-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 1;
        srgb.b = 1;
        srgb.to.hsv()
      `,
      );

      expect((result as any).value.s.value).toBeCloseTo(0, 9);
      expect((result as any).value.v.value).toBeCloseTo(1, 9);
    });

    it("should handle black (S=0, V=0)", async () => {
      const result = await executeWithSchema(
        "hsv-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0;
        srgb.g = 0;
        srgb.b = 0;
        srgb.to.hsv()
      `,
      );

      expect((result as any).value.s.value).toBeCloseTo(0, 9);
      expect((result as any).value.v.value).toBeCloseTo(0, 9);
    });

    it("should handle gray (S=0)", async () => {
      const result = await executeWithSchema(
        "hsv-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0.5;
        srgb.g = 0.5;
        srgb.b = 0.5;
        srgb.to.hsv()
      `,
      );

      expect((result as any).value.s.value).toBeCloseTo(0, 9);
      expect((result as any).value.v.value).toBeCloseTo(0.5, 9);
    });
  });
});

