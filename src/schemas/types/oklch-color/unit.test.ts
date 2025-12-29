/**
 * OKLCH Color Schema Tests
 *
 * Tests for the OKLCH color space (polar form of OKLab)
 * Validates against ColorJS for parity
 */

import { log } from "@tests/helpers/logger";
import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

// ColorJS reference tolerance
// Hue angles can have larger differences near 0/360
const TOLERANCE = 1e-6;
const HUE_TOLERANCE = 1e-3;

describe("OKLCH Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("oklch-color")) as ColorSpecification;

      expect(schema.name).toBe("OKLCH");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("l");
      expect(schema.schema?.properties).toHaveProperty("c");
      expect(schema.schema?.properties).toHaveProperty("h");
      expect(schema.schema?.required).toEqual(["l", "c", "h"]);
    });

    it("should have oklch initializer", async () => {
      const schema = (await getBundledSchema("oklch-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("oklch");
      expect(schema.initializers[0].script.script).toContain("Color.OKLCH");
    });

    it("should have conversion from OKLab", async () => {
      const schema = (await getBundledSchema("oklch-color")) as ColorSpecification;

      expect(schema.conversions).toHaveLength(1);

      const oklabToOklch = schema.conversions.find((c: { source: string }) =>
        c.source.includes("oklab-color"),
      );
      expect(oklabToOklch).toBeDefined();
      expect(oklabToOklch?.lossless).toBe(true);
    });
  });

  describe("Initialization", () => {
    it("should create OKLCH color from values", async () => {
      const result = await executeWithSchema(
        "oklch-color",
        "type",
        `
        variable c: Color.OKLCH;
        c.l = 0.7;
        c.c = 0.15;
        c.h = 30;
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("OKLCH");
      expect((result as any).value.l.value).toBeCloseTo(0.7, 10);
      expect((result as any).value.c.value).toBeCloseTo(0.15, 10);
      expect((result as any).value.h.value).toBeCloseTo(30, 10);
    });
  });

  describe("Conversion from OKLab to OKLCH", () => {
    it("should convert OKLab to OKLCH correctly", async () => {
      const result = await executeWithSchema(
        "oklch-color",
        "type",
        `
        variable lab: Color.OKLab;
        lab.l = 0.7;
        lab.a = 0.1;
        lab.b = 0.05;
        lab.to.oklch()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("oklab", [0.7, 0.1, 0.05]).to("oklch");

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("OKLCH");
      expect((result as any).value.l.value).toBeCloseTo(colorJS.coords[0], 9);
      expect((result as any).value.c.value).toBeCloseTo(colorJS.coords[1], 9);
      expect((result as any).value.h.value).toBeCloseTo(colorJS.coords[2], 3);
    });
  });

  describe("Full Conversion Chain: sRGB → ... → OKLab → OKLCH", () => {
    it("should convert sRGB red through to OKLCH", async () => {
      const result = await executeWithSchema(
        "oklch-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 0;
        srgb.b = 0;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz: Color.XYZD65 = linear.to.xyzd65();
        variable lab: Color.OKLab = xyz.to.oklab();
        lab.to.oklch()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("srgb", [1, 0, 0]).to("oklch");

      log.info(`\n=== sRGB RED → OKLCH (full chain) ===`);
      log.info(
        `TokenScript: { l: ${(result as any).value.l.value}, c: ${(result as any).value.c.value}, h: ${(result as any).value.h.value} }`,
      );
      log.info(
        `ColorJS:     { l: ${colorJS.coords[0]}, c: ${colorJS.coords[1]}, h: ${colorJS.coords[2]} }`,
      );

      expect((result as any).value.l.value).toBeCloseTo(colorJS.coords[0], 6);
      expect((result as any).value.c.value).toBeCloseTo(colorJS.coords[1], 6);
      expect((result as any).value.h.value).toBeCloseTo(colorJS.coords[2], 1); // Hue needs more tolerance
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
      { name: "coral", srgb: [1, 0.341, 0.2] },
    ];

    for (const { name, srgb } of testCases) {
      it(`should match ColorJS for ${name}`, async () => {
        const result = await executeWithSchema(
          "oklch-color",
          "type",
          `
          variable srgb: Color.SRGB;
          srgb.r = ${srgb[0]};
          srgb.g = ${srgb[1]};
          srgb.b = ${srgb[2]};
          
          variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
          variable xyz: Color.XYZD65 = linear.to.xyzd65();
          variable lab: Color.OKLab = xyz.to.oklab();
          lab.to.oklch()
        `,
        );

        // ColorJS reference
        const colorJS = new Color("srgb", srgb as [number, number, number]).to("oklch");

        const tsL = (result as any).value.l.value;
        const tsC = (result as any).value.c.value;
        const tsH = (result as any).value.h.value;

        const diffL = Math.abs(tsL - colorJS.coords[0]);
        const diffC = Math.abs(tsC - colorJS.coords[1]);
        // For hue, handle the 0/360 wraparound
        let diffH = Math.abs(tsH - colorJS.coords[2]);
        if (diffH > 180) diffH = 360 - diffH;

        const maxDiff = Math.max(diffL, diffC);

        log.info(`\n=== ${name.toUpperCase()} ColorJS Parity ===`);
        log.info(`Input sRGB:  { r: ${srgb[0]}, g: ${srgb[1]}, b: ${srgb[2]} }`);
        log.info(
          `TokenScript: { l: ${tsL.toFixed(6)}, c: ${tsC.toFixed(6)}, h: ${tsH.toFixed(3)} }`,
        );
        log.info(
          `ColorJS:     { l: ${colorJS.coords[0].toFixed(6)}, c: ${colorJS.coords[1].toFixed(6)}, h: ${colorJS.coords[2].toFixed(3)} }`,
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
        "oklch-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0.5;
        srgb.g = 0.5;
        srgb.b = 0.5;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz: Color.XYZD65 = linear.to.xyzd65();
        variable lab: Color.OKLab = xyz.to.oklab();
        lab.to.oklch()
      `,
      );

      // Gray should have chroma ≈ 0
      // Hue is undefined for neutral colors (NaN in ColorJS)
      expect((result as any).value.c.value).toBeLessThan(1e-5);
    });

    it("should handle black (L=0, C=0)", async () => {
      const result = await executeWithSchema(
        "oklch-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0;
        srgb.g = 0;
        srgb.b = 0;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz: Color.XYZD65 = linear.to.xyzd65();
        variable lab: Color.OKLab = xyz.to.oklab();
        lab.to.oklch()
      `,
      );

      expect((result as any).value.l.value).toBeCloseTo(0, 6);
      expect((result as any).value.c.value).toBeCloseTo(0, 6);
    });

    it("should handle white (L=1, C=0)", async () => {
      const result = await executeWithSchema(
        "oklch-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 1;
        srgb.b = 1;
        
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz: Color.XYZD65 = linear.to.xyzd65();
        variable lab: Color.OKLab = xyz.to.oklab();
        lab.to.oklch()
      `,
      );

      const colorJS = new Color("srgb", [1, 1, 1]).to("oklch");

      expect((result as any).value.l.value).toBeCloseTo(colorJS.coords[0], 6);
      expect((result as any).value.c.value).toBeLessThan(1e-5);
    });
  });

  describe("Alpha Channel Support", () => {
    it("should accept optional 4th parameter for alpha", async () => {
      const result = await executeWithSchema(
        "oklch-color",
        "type",
        `
        variable c: Color.OKLCH = oklch(0.5, 0.1, 180, 0.7);
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("OKLCH");
      expect((result as any).alpha).toBe(0.7);
    });

    it("should get alpha property", async () => {
      const result = await executeWithSchema(
        "oklch-color",
        "type",
        `
        variable c: Color.OKLCH = oklch(0.5, 0.1, 180, 0.5);
        c.alpha
      `,
      );

      expect((result as any).value).toBe(0.5);
    });

    it("should set alpha property", async () => {
      const result = await executeWithSchema(
        "oklch-color",
        "type",
        `
        variable c: Color.OKLCH = oklch(0.5, 0.1, 180);
        c.alpha = 0.8;
        c.alpha
      `,
      );

      expect((result as any).value).toBe(0.8);
    });

    it("should preserve alpha through conversions", async () => {
      const result = await executeWithSchema(
        "oklch-color",
        "type",
        `
        variable c: Color.OKLCH = oklch(0.5, 0.1, 180, 0.6);
        variable oklab: Color.OKLab = c.to.oklab();
        oklab.alpha
      `,
      );

      expect((result as any).value).toBe(0.6);
    });
  });
});
