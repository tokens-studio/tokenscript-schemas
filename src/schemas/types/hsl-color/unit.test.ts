/**
 * HSL Color Schema Tests
 *
 * Tests for the HSL color space (Hue, Saturation, Lightness)
 * Validates against ColorJS for parity
 */

import { log } from "@tests/helpers/logger";
import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";
import { describe, expect, it } from "vitest";
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

      expect(schema.initializers).toHaveLength(2);
      expect(schema.initializers[0].keyword).toBe("hsl");
      expect(schema.initializers[1].keyword).toBe("hsla");
    });

    it("should have conversion from sRGB", async () => {
      const schema = (await getBundledSchema("hsl-color")) as ColorSpecification;

      expect(schema.conversions).toHaveLength(1);

      const srgbToHsl = schema.conversions.find((c: { source: string }) =>
        c.source.includes("srgb-color"),
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

      log.info(`\n=== sRGB RED → HSL ===`);
      log.info(
        `TokenScript: { h: ${(result as any).value.h.value}, s: ${(result as any).value.s.value}, l: ${(result as any).value.l.value} }`,
      );
      log.info(`ColorJS:     { h: ${colorJS.coords[0]}, s: ${cjS}, l: ${cjL} } (normalized)`);

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
        const colorJS = new Color("srgb", srgb as [number, number, number]).to("hsl");

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

        log.info(`\n=== ${name.toUpperCase()} ColorJS Parity ===`);
        log.info(`Input sRGB:  { r: ${srgb[0]}, g: ${srgb[1]}, b: ${srgb[2]} }`);
        log.info(
          `TokenScript: { h: ${tsH.toFixed(3)}, s: ${tsS.toFixed(6)}, l: ${tsL.toFixed(6)} }`,
        );
        log.info(
          `ColorJS:     { h: ${colorJS.coords[0].toFixed(3)}, s: ${cjS.toFixed(6)}, l: ${cjL.toFixed(6)} } (normalized from 0-100)`,
        );
        log.info(`Max Diff (S,L): ${maxDiff.toExponential(2)}`);
        log.info(`Hue Diff:       ${diffH.toExponential(2)}`);
        log.info(
          `Status:         ${maxDiff < TOLERANCE && diffH < HUE_TOLERANCE ? "✅ PASS" : "❌ FAIL"}`,
        );

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

  describe("Alpha Channel Support", () => {
    it("should accept optional 4th parameter for alpha using hsl()", async () => {
      const result = await executeWithSchema(
        "hsl-color",
        "type",
        `
        variable c: Color.HSL = hsl(180, 0.5, 0.5, 0.7);
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("HSL");
      expect((result as any).value.h.value).toBe(180);
      expect((result as any).value.s.value).toBe(0.5);
      expect((result as any).value.l.value).toBe(0.5);
      expect((result as any).alpha).toBe(0.7);
    });

    it("should create color with hsla() initializer", async () => {
      const result = await executeWithSchema(
        "hsl-color",
        "type",
        `
        variable c: Color.HSL = hsla(240, 0.8, 0.6, 0.9);
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("HSL");
      expect((result as any).value.h.value).toBe(240);
      expect((result as any).value.s.value).toBe(0.8);
      expect((result as any).value.l.value).toBe(0.6);
      expect((result as any).alpha).toBe(0.9);
    });

    it("should get alpha property", async () => {
      const result = await executeWithSchema(
        "hsl-color",
        "type",
        `
        variable c: Color.HSL = hsl(0, 1, 0.5, 0.5);
        c.alpha
      `,
      );

      expect((result as any).value).toBe(0.5);
    });

    it("should set alpha property", async () => {
      const result = await executeWithSchema(
        "hsl-color",
        "type",
        `
        variable c: Color.HSL = hsl(0, 1, 0.5);
        c.alpha = 0.8;
        c.alpha
      `,
      );

      expect((result as any).value).toBe(0.8);
    });

    it("should preserve alpha through conversion to sRGB", async () => {
      const result = await executeWithSchema(
        "hsl-color",
        "type",
        `
        variable c: Color.HSL = hsl(120, 1, 0.5, 0.6);
        variable srgb: Color.SRGB = c.to.srgb();
        srgb.alpha
      `,
      );

      expect((result as any).value).toBe(0.6);
    });

    it("should preserve alpha through conversion from sRGB", async () => {
      const result = await executeWithSchema(
        "hsl-color",
        "type",
        `
        variable srgb: Color.SRGB = srgb(1, 0, 0, 0.4);
        variable c: Color.HSL = srgb.to.hsl();
        c.alpha
      `,
      );

      expect((result as any).value).toBe(0.4);
    });
  });
});
