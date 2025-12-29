/**
 * sRGB Color Schema Tests
 *
 * Tests for the sRGB color space (normalized 0-1 range)
 * Validates against ColorJS for parity
 */

import { log } from "@tests/helpers/logger";
import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

// ColorJS reference tolerance
const TOLERANCE = 1e-10;

describe("sRGB Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("srgb-color")) as ColorSpecification;

      expect(schema.name).toBe("SRGB");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("r");
      expect(schema.schema?.properties).toHaveProperty("g");
      expect(schema.schema?.properties).toHaveProperty("b");
      expect(schema.schema?.required).toEqual(["r", "g", "b"]);
    });

    it("should have srgb initializer", async () => {
      const schema = (await getBundledSchema("srgb-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("srgb");
      expect(schema.initializers[0].script.script).toContain("Color.SRGB");
    });

    it("should have conversion from RGB", async () => {
      const schema = (await getBundledSchema("srgb-color")) as ColorSpecification;

      expect(schema.conversions.length).toBeGreaterThanOrEqual(1);

      const rgbToSrgb = schema.conversions.find((c: { source: string }) =>
        c.source.includes("rgb-color"),
      );
      expect(rgbToSrgb).toBeDefined();
      expect(rgbToSrgb?.lossless).toBe(true);
    });
  });

  describe("Initialization", () => {
    it("should create sRGB color from normalized values", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable c: Color.SRGB;
        c.r = 1.0;
        c.g = 0.5;
        c.b = 0.25;
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBeCloseTo(1.0, 10);
      expect((result as any).value.g.value).toBeCloseTo(0.5, 10);
      expect((result as any).value.b.value).toBeCloseTo(0.25, 10);
    });

    it("should handle black (0, 0, 0)", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable c: Color.SRGB;
        c.r = 0;
        c.g = 0;
        c.b = 0;
        c
      `,
      );

      expect((result as any).value.r.value).toBe(0);
      expect((result as any).value.g.value).toBe(0);
      expect((result as any).value.b.value).toBe(0);
    });

    it("should handle white (1, 1, 1)", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable c: Color.SRGB;
        c.r = 1;
        c.g = 1;
        c.b = 1;
        c
      `,
      );

      expect((result as any).value.r.value).toBe(1);
      expect((result as any).value.g.value).toBe(1);
      expect((result as any).value.b.value).toBe(1);
    });
  });

  describe("Conversion from RGB (0-255) to sRGB (0-1)", () => {
    it("should convert RGB red to sRGB", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable rgb: Color.Rgb;
        rgb.r = 255;
        rgb.g = 0;
        rgb.b = 0;
        rgb.to.srgb()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("srgb", [1, 0, 0]);

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBeCloseTo(colorJS.coords[0], 10);
      expect((result as any).value.g.value).toBeCloseTo(colorJS.coords[1], 10);
      expect((result as any).value.b.value).toBeCloseTo(colorJS.coords[2], 10);
    });

    it("should convert RGB green to sRGB", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable rgb: Color.Rgb;
        rgb.r = 0;
        rgb.g = 255;
        rgb.b = 0;
        rgb.to.srgb()
      `,
      );

      const colorJS = new Color("srgb", [0, 1, 0]);

      expect((result as any).value.r.value).toBeCloseTo(colorJS.coords[0], 10);
      expect((result as any).value.g.value).toBeCloseTo(colorJS.coords[1], 10);
      expect((result as any).value.b.value).toBeCloseTo(colorJS.coords[2], 10);
    });

    it("should convert RGB blue to sRGB", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable rgb: Color.Rgb;
        rgb.r = 0;
        rgb.g = 0;
        rgb.b = 255;
        rgb.to.srgb()
      `,
      );

      const colorJS = new Color("srgb", [0, 0, 1]);

      expect((result as any).value.r.value).toBeCloseTo(colorJS.coords[0], 10);
      expect((result as any).value.g.value).toBeCloseTo(colorJS.coords[1], 10);
      expect((result as any).value.b.value).toBeCloseTo(colorJS.coords[2], 10);
    });

    it("should convert mid-gray RGB to sRGB", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable rgb: Color.Rgb;
        rgb.r = 128;
        rgb.g = 128;
        rgb.b = 128;
        rgb.to.srgb()
      `,
      );

      // 128/255 ≈ 0.50196
      const expected = 128 / 255;

      expect((result as any).value.r.value).toBeCloseTo(expected, 10);
      expect((result as any).value.g.value).toBeCloseTo(expected, 10);
      expect((result as any).value.b.value).toBeCloseTo(expected, 10);
    });

    it("should convert coral (#ff5733) RGB to sRGB", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable rgb: Color.Rgb;
        rgb.r = 255;
        rgb.g = 87;
        rgb.b = 51;
        rgb.to.srgb()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("#ff5733");

      expect((result as any).value.r.value).toBeCloseTo(colorJS.coords[0], 5);
      expect((result as any).value.g.value).toBeCloseTo(colorJS.coords[1], 5);
      expect((result as any).value.b.value).toBeCloseTo(colorJS.coords[2], 5);
    });
  });

  describe("ColorJS Parity", () => {
    const testCases = [
      { name: "red", rgb: [255, 0, 0], srgb: [1, 0, 0] },
      { name: "green", rgb: [0, 255, 0], srgb: [0, 1, 0] },
      { name: "blue", rgb: [0, 0, 255], srgb: [0, 0, 1] },
      { name: "black", rgb: [0, 0, 0], srgb: [0, 0, 0] },
      { name: "white", rgb: [255, 255, 255], srgb: [1, 1, 1] },
      { name: "gray", rgb: [128, 128, 128], srgb: [128 / 255, 128 / 255, 128 / 255] },
      { name: "coral", rgb: [255, 87, 51], srgb: [1, 87 / 255, 51 / 255] },
    ];

    for (const { name, rgb, srgb } of testCases) {
      it(`should match ColorJS for ${name}`, async () => {
        const result = await executeWithSchema(
          "srgb-color",
          "type",
          `
          variable rgb: Color.Rgb;
          rgb.r = ${rgb[0]};
          rgb.g = ${rgb[1]};
          rgb.b = ${rgb[2]};
          rgb.to.srgb()
        `,
        );

        // ColorJS reference
        const colorJS = new Color("srgb", srgb as [number, number, number]);

        const tsR = (result as any).value.r.value;
        const tsG = (result as any).value.g.value;
        const tsB = (result as any).value.b.value;

        const diffR = Math.abs(tsR - colorJS.coords[0]);
        const diffG = Math.abs(tsG - colorJS.coords[1]);
        const diffB = Math.abs(tsB - colorJS.coords[2]);
        const maxDiff = Math.max(diffR, diffG, diffB);

        // Log for documentation (only shown when LOG_LEVEL is set)
        log.info(`\n=== ${name.toUpperCase()} ColorJS Parity ===`);
        log.info(`TokenScript: { r: ${tsR}, g: ${tsG}, b: ${tsB} }`);
        log.info(
          `ColorJS:     { r: ${colorJS.coords[0]}, g: ${colorJS.coords[1]}, b: ${colorJS.coords[2]} }`,
        );
        log.info(`Max Diff:    ${maxDiff.toExponential(2)}`);
        log.info(`Status:      ${maxDiff < TOLERANCE ? "✅ PASS" : "❌ FAIL"}`);

        expect(maxDiff).toBeLessThan(TOLERANCE);
      });
    }
  });

  describe("Edge Cases", () => {
    it("should handle very small values", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable rgb: Color.Rgb;
        rgb.r = 1;
        rgb.g = 1;
        rgb.b = 1;
        rgb.to.srgb()
      `,
      );

      const expected = 1 / 255;
      expect((result as any).value.r.value).toBeCloseTo(expected, 10);
    });

    it("should handle near-max values", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable rgb: Color.Rgb;
        rgb.r = 254;
        rgb.g = 254;
        rgb.b = 254;
        rgb.to.srgb()
      `,
      );

      const expected = 254 / 255;
      expect((result as any).value.r.value).toBeCloseTo(expected, 10);
    });
  });

  describe("Alpha Channel Support", () => {
    it("should accept optional 4th parameter for alpha", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable c: Color.SRGB = srgb(1, 0, 0, 0.5);
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(1);
      expect((result as any).value.g.value).toBe(0);
      expect((result as any).value.b.value).toBe(0);
      // Alpha is stored directly, not as a Symbol
      expect((result as any).alpha).toBe(0.5);
    });

    it("should get alpha property", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable c: Color.SRGB = srgb(1, 0, 0, 0.7);
        c.alpha
      `,
      );

      // When accessing .alpha it returns a NumberSymbol
      expect((result as any).value).toBe(0.7);
    });

    it("should set alpha property", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable c: Color.SRGB = srgb(1, 0, 0);
        c.alpha = 0.3;
        c.alpha
      `,
      );

      expect((result as any).value).toBe(0.3);
    });

    it("should handle alpha = 0 (fully transparent)", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable c: Color.SRGB = srgb(1, 0, 0, 0);
        c.alpha
      `,
      );

      expect((result as any).value).toBe(0);
    });

    it("should handle alpha = 1 (fully opaque)", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable c: Color.SRGB = srgb(1, 0, 0, 1);
        c.alpha
      `,
      );

      expect((result as any).value).toBe(1);
    });

    it("should preserve alpha through conversion from RGB", async () => {
      const result = await executeWithSchema(
        "srgb-color",
        "type",
        `
        variable rgb: Color.Rgb = rgb(255, 0, 0, 0.8);
        variable c: Color.SRGB = rgb.to.srgb();
        c.alpha
      `,
      );

      expect((result as any).value).toBe(0.8);
    });
  });
});
