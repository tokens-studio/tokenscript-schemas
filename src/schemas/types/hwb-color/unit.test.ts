/**
 * HWB Color Schema Tests
 *
 * Tests for the HWB color space (Hue, Whiteness, Blackness)
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

describe("HWB Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("hwb-color")) as ColorSpecification;

      expect(schema.name).toBe("HWB");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("h");
      expect(schema.schema?.properties).toHaveProperty("w");
      expect(schema.schema?.properties).toHaveProperty("b");
    });

    it("should have hwb initializer", async () => {
      const schema = (await getBundledSchema("hwb-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(2);
      expect(schema.initializers[0].keyword).toBe("hwb");
      expect(schema.initializers[1].keyword).toBe("hwba");
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
      { name: "coral", srgb: [1, 0.5, 0.314] },
    ];

    for (const { name, srgb } of testCases) {
      it(`should match ColorJS for ${name}`, async () => {
        const result = await executeWithSchema(
          "hwb-color",
          "type",
          `
          variable srgb: Color.SRGB;
          srgb.r = ${srgb[0]};
          srgb.g = ${srgb[1]};
          srgb.b = ${srgb[2]};
          
          variable hsv: Color.HSV = srgb.to.hsv();
          hsv.to.hwb()
        `,
        );

        // ColorJS reference (uses 0-100 for W and B, we use 0-1)
        const colorJS = new Color("srgb", srgb as [number, number, number]).to("hwb");
        const cjW = colorJS.coords[1] / 100;
        const cjB = colorJS.coords[2] / 100;

        const tsH = (result as any).value.h.value;
        const tsW = (result as any).value.w.value;
        const tsB = (result as any).value.b.value;

        let diffH = Math.abs(tsH - colorJS.coords[0]);
        if (diffH > 180) diffH = 360 - diffH;
        const diffW = Math.abs(tsW - cjW);
        const diffB = Math.abs(tsB - cjB);
        const maxDiff = Math.max(diffW, diffB);

        log.info(`\n=== ${name.toUpperCase()} ColorJS Parity ===`);
        log.info(`Input sRGB:  { r: ${srgb[0]}, g: ${srgb[1]}, b: ${srgb[2]} }`);
        log.info(
          `TokenScript: { h: ${tsH.toFixed(3)}, w: ${tsW.toFixed(6)}, b: ${tsB.toFixed(6)} }`,
        );
        log.info(
          `ColorJS:     { h: ${colorJS.coords[0].toFixed(3)}, w: ${cjW.toFixed(6)}, b: ${cjB.toFixed(6)} } (normalized)`,
        );
        log.info(`Max Diff (W,B): ${maxDiff.toExponential(2)}`);
        log.info(`Status:         ${maxDiff < TOLERANCE ? "✅ PASS" : "❌ FAIL"}`);

        expect(maxDiff).toBeLessThan(TOLERANCE);
        expect(diffH).toBeLessThan(HUE_TOLERANCE);
      });
    }
  });

  describe("Edge Cases", () => {
    it("should handle white (W=1, B=0)", async () => {
      const result = await executeWithSchema(
        "hwb-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 1;
        srgb.b = 1;
        
        variable hsv: Color.HSV = srgb.to.hsv();
        hsv.to.hwb()
      `,
      );

      expect((result as any).value.w.value).toBeCloseTo(1, 9);
      expect((result as any).value.b.value).toBeCloseTo(0, 9);
    });

    it("should handle black (W=0, B=1)", async () => {
      const result = await executeWithSchema(
        "hwb-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0;
        srgb.g = 0;
        srgb.b = 0;
        
        variable hsv: Color.HSV = srgb.to.hsv();
        hsv.to.hwb()
      `,
      );

      expect((result as any).value.w.value).toBeCloseTo(0, 9);
      expect((result as any).value.b.value).toBeCloseTo(1, 9);
    });

    it("should handle gray (W+B near 1)", async () => {
      const result = await executeWithSchema(
        "hwb-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0.5;
        srgb.g = 0.5;
        srgb.b = 0.5;
        
        variable hsv: Color.HSV = srgb.to.hsv();
        hsv.to.hwb()
      `,
      );

      // For gray, W + B = 1
      expect((result as any).value.w.value).toBeCloseTo(0.5, 9);
      expect((result as any).value.b.value).toBeCloseTo(0.5, 9);
    });
  });

  describe("Alpha Channel Support", () => {
    it("should accept optional 4th parameter for alpha using hwb()", async () => {
      const result = await executeWithSchema(
        "hwb-color",
        "type",
        `
        variable c: Color.HWB = hwb(180, 0.2, 0.3, 0.7);
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("HWB");
      expect((result as any).alpha).toBe(0.7);
    });

    it("should create color with hwba() initializer", async () => {
      const result = await executeWithSchema(
        "hwb-color",
        "type",
        `
        variable c: Color.HWB = hwba(240, 0.1, 0.2, 0.85);
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("HWB");
      expect((result as any).value.h.value).toBe(240);
      expect((result as any).value.w.value).toBe(0.1);
      expect((result as any).value.b.value).toBe(0.2);
      expect((result as any).alpha).toBe(0.85);
    });

    it("should get alpha property", async () => {
      const result = await executeWithSchema(
        "hwb-color",
        "type",
        `
        variable c: Color.HWB = hwb(0, 0, 0, 0.3);
        c.alpha
      `,
      );

      expect((result as any).value).toBe(0.3);
    });

    it("should set alpha property", async () => {
      const result = await executeWithSchema(
        "hwb-color",
        "type",
        `
        variable c: Color.HWB = hwb(0, 0, 0);
        c.alpha = 0.9;
        c.alpha
      `,
      );

      expect((result as any).value).toBe(0.9);
    });
  });
});
