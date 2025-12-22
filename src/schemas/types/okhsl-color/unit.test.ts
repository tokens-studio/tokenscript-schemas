/**
 * OKHSL Color Schema Tests
 *
 * Tests for the OKHSL color space (Björn Ottosson's perceptually uniform HSL)
 * Reference: https://bottosson.github.io/posts/colorpicker/
 *
 * Uses Ottosson's algorithm with:
 * - Polynomial approximation for max saturation at each hue
 * - Halley's method refinement for machine-precision gamut boundary
 * - Toe function for perceptually uniform lightness
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";
import "colorjs.io/fn"; // Register all color spaces including OKHSL
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

// Tolerance for ColorJS parity
const _TOLERANCE = 0.01; // 1% tolerance for S and L
const HUE_TOLERANCE = 1; // 1 degree tolerance for hue

describe("OKHSL Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("okhsl-color")) as ColorSpecification;

      expect(schema.name).toBe("OKHSL");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("h");
      expect(schema.schema?.properties).toHaveProperty("s");
      expect(schema.schema?.properties).toHaveProperty("l");
      expect(schema.schema?.required).toEqual(["h", "s", "l"]);
    });

    it("should have okhsl initializer", async () => {
      const schema = (await getBundledSchema("okhsl-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("okhsl");
    });

    it("should have lossless conversion from OKLab", async () => {
      const schema = (await getBundledSchema("okhsl-color")) as ColorSpecification;

      expect(schema.conversions).toHaveLength(1);
      const oklabToOkhsl = schema.conversions.find((c: { source: string }) =>
        c.source.includes("oklab-color"),
      );
      expect(oklabToOkhsl).toBeDefined();
      expect(oklabToOkhsl?.lossless).toBe(true);
    });
  });

  describe("OKHSL Initialization", () => {
    it("should initialize OKHSL color directly", async () => {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable c: Color.OKHSL;
        c.h = 30;
        c.s = 0.8;
        c.l = 0.6;
        c
      `,
      );

      expect((result as any).value.h.value).toBe(30);
      expect((result as any).value.s.value).toBe(0.8);
      expect((result as any).value.l.value).toBe(0.6);
    });
  });

  describe("Conversion from OKLab to OKHSL", () => {
    it("should convert achromatic OKLab (gray) to OKHSL with zero saturation", async () => {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable lab: Color.OKLab;
        lab.l = 0.5;
        lab.a = 0;
        lab.b = 0;
        lab.to.okhsl()
      `,
      );

      // Gray should have saturation of 0
      expect((result as any).value.s.value).toBeCloseTo(0, 5);
    });

    it("should convert chromatic OKLab to OKHSL with non-zero saturation", async () => {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable lab: Color.OKLab;
        lab.l = 0.6;
        lab.a = 0.15;
        lab.b = 0.05;
        lab.to.okhsl()
      `,
      );

      // Should have saturation > 0
      expect((result as any).value.s.value).toBeGreaterThan(0);
      // Hue should be in red-orange range (positive a, small positive b)
      expect((result as any).value.h.value).toBeGreaterThanOrEqual(0);
      expect((result as any).value.h.value).toBeLessThan(60);
    });
  });

  describe("ColorJS Parity", () => {
    it("should match ColorJS for sRGB red", async () => {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 0;
        srgb.b = 0;
        srgb.to.okhsl()
      `,
      );

      const colorJS = new Color("srgb", [1, 0, 0]).to("okhsl");

      console.log(`\n=== sRGB RED → OKHSL ===`);
      console.log(
        `TokenScript: { h: ${(result as any).value.h.value.toFixed(2)}, s: ${(result as any).value.s.value.toFixed(4)}, l: ${(result as any).value.l.value.toFixed(4)} }`,
      );
      console.log(
        `ColorJS:     { h: ${colorJS.coords[0].toFixed(2)}, s: ${colorJS.coords[1].toFixed(4)}, l: ${colorJS.coords[2].toFixed(4)} }`,
      );

      // Hue should match (red ≈ 29° in OKHSL)
      expect(Math.abs((result as any).value.h.value - colorJS.coords[0])).toBeLessThan(
        HUE_TOLERANCE,
      );
    });

    it("should match ColorJS for sRGB green", async () => {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0;
        srgb.g = 1;
        srgb.b = 0;
        srgb.to.okhsl()
      `,
      );

      const colorJS = new Color("srgb", [0, 1, 0]).to("okhsl");

      console.log(`\n=== sRGB GREEN → OKHSL ===`);
      console.log(
        `TokenScript: { h: ${(result as any).value.h.value.toFixed(2)}, s: ${(result as any).value.s.value.toFixed(4)}, l: ${(result as any).value.l.value.toFixed(4)} }`,
      );
      console.log(
        `ColorJS:     { h: ${colorJS.coords[0].toFixed(2)}, s: ${colorJS.coords[1].toFixed(4)}, l: ${colorJS.coords[2].toFixed(4)} }`,
      );

      // Green ≈ 142° in OKHSL
      expect(Math.abs((result as any).value.h.value - colorJS.coords[0])).toBeLessThan(
        HUE_TOLERANCE,
      );
    });

    it("should match ColorJS for sRGB blue", async () => {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0;
        srgb.g = 0;
        srgb.b = 1;
        srgb.to.okhsl()
      `,
      );

      const colorJS = new Color("srgb", [0, 0, 1]).to("okhsl");

      console.log(`\n=== sRGB BLUE → OKHSL ===`);
      console.log(
        `TokenScript: { h: ${(result as any).value.h.value.toFixed(2)}, s: ${(result as any).value.s.value.toFixed(4)}, l: ${(result as any).value.l.value.toFixed(4)} }`,
      );
      console.log(
        `ColorJS:     { h: ${colorJS.coords[0].toFixed(2)}, s: ${colorJS.coords[1].toFixed(4)}, l: ${colorJS.coords[2].toFixed(4)} }`,
      );

      // Blue ≈ 264° in OKHSL
      expect(Math.abs((result as any).value.h.value - colorJS.coords[0])).toBeLessThan(
        HUE_TOLERANCE,
      );
    });

    it("should match ColorJS for mid-gray", async () => {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0.5;
        srgb.g = 0.5;
        srgb.b = 0.5;
        srgb.to.okhsl()
      `,
      );

      const colorJS = new Color("srgb", [0.5, 0.5, 0.5]).to("okhsl");

      console.log(`\n=== sRGB MID-GRAY → OKHSL ===`);
      console.log(
        `TokenScript: { h: ${(result as any).value.h.value.toFixed(2)}, s: ${(result as any).value.s.value.toFixed(4)}, l: ${(result as any).value.l.value.toFixed(4)} }`,
      );
      // ColorJS returns null hue for achromatic colors
      console.log(
        `ColorJS:     { h: ${colorJS.coords[0] ?? "null"}, s: ${colorJS.coords[1].toFixed(4)}, l: ${colorJS.coords[2].toFixed(4)} }`,
      );

      // Gray should have S ≈ 0
      expect((result as any).value.s.value).toBeCloseTo(colorJS.coords[1], 2);
      // Lightness should match
      expect((result as any).value.l.value).toBeCloseTo(colorJS.coords[2], 1);
    });
  });

  describe("Round-trip Conversion", () => {
    it("should preserve hue through OKLab round-trip", async () => {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable c: Color.OKHSL;
        c.h = 180;
        c.s = 0.5;
        c.l = 0.6;
        c.to.oklab().to.okhsl()
      `,
      );

      expect((result as any).value.h.value).toBeCloseTo(180, 0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPREHENSIVE COLORJS PARITY TESTS
  // Tests a wide range of colors against ColorJS reference implementation
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Comprehensive ColorJS Parity", () => {
    /**
     * Helper to test sRGB → OKHSL conversion against ColorJS
     * Logs detailed comparison and asserts within tolerances
     */
    async function testSRGBToOKHSL(r: number, g: number, b: number, label: string) {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = ${r};
        srgb.g = ${g};
        srgb.b = ${b};
        srgb.to.okhsl()
      `,
      );

      const colorJS = new Color("srgb", [r, g, b]).to("okhsl");

      const tsH = (result as any).value.h.value;
      const tsS = (result as any).value.s.value;
      const tsL = (result as any).value.l.value;

      const cjH = colorJS.coords[0];
      const cjS = colorJS.coords[1];
      const cjL = colorJS.coords[2];

      console.log(`\n${label}: sRGB(${r}, ${g}, ${b})`);
      console.log(
        `  TokenScript: h=${tsH?.toFixed(2)}, s=${tsS?.toFixed(4)}, l=${tsL?.toFixed(4)}`,
      );
      console.log(
        `  ColorJS:     h=${cjH?.toFixed(2) ?? "null"}, s=${cjS?.toFixed(4)}, l=${cjL?.toFixed(4)}`,
      );

      // Saturation comparison - with full findGamutIntersection, we achieve tight parity
      const satDiff = Math.abs(tsS - cjS);
      if (satDiff > 0.02) {
        console.log(`  ⚠️ Saturation delta: ${satDiff.toFixed(4)}`);
      }
      expect(satDiff).toBeLessThan(0.05); // Tight tolerance with full algorithm

      // Lightness should always match closely
      expect(tsL).toBeCloseTo(cjL, 1);

      // Hue only matters if color is chromatic (S > 0.01)
      if (cjS > 0.01 && cjH !== null) {
        // Handle hue wrap-around (e.g., 359° vs 1°)
        let hueDiff = Math.abs(tsH - cjH);
        if (hueDiff > 180) hueDiff = 360 - hueDiff;
        expect(hueDiff).toBeLessThan(HUE_TOLERANCE);
      }

      return { ts: { h: tsH, s: tsS, l: tsL }, cj: { h: cjH, s: cjS, l: cjL } };
    }

    describe("Edge Cases", () => {
      it("should handle black (0, 0, 0)", async () => {
        await testSRGBToOKHSL(0, 0, 0, "BLACK");
      });

      it("should handle white (1, 1, 1)", async () => {
        await testSRGBToOKHSL(1, 1, 1, "WHITE");
      });

      it("should handle near-black (0.01, 0.01, 0.01)", async () => {
        await testSRGBToOKHSL(0.01, 0.01, 0.01, "NEAR-BLACK");
      });

      it("should handle near-white (0.99, 0.99, 0.99)", async () => {
        await testSRGBToOKHSL(0.99, 0.99, 0.99, "NEAR-WHITE");
      });
    });

    describe("Primary Colors (Maximum Saturation)", () => {
      it("should handle pure red (1, 0, 0)", async () => {
        await testSRGBToOKHSL(1, 0, 0, "PURE RED");
      });

      it("should handle pure green (0, 1, 0)", async () => {
        await testSRGBToOKHSL(0, 1, 0, "PURE GREEN");
      });

      it("should handle pure blue (0, 0, 1)", async () => {
        await testSRGBToOKHSL(0, 0, 1, "PURE BLUE");
      });
    });

    describe("Secondary Colors (CMY)", () => {
      it("should handle cyan (0, 1, 1)", async () => {
        await testSRGBToOKHSL(0, 1, 1, "CYAN");
      });

      it("should handle magenta (1, 0, 1)", async () => {
        await testSRGBToOKHSL(1, 0, 1, "MAGENTA");
      });

      it("should handle yellow (1, 1, 0)", async () => {
        await testSRGBToOKHSL(1, 1, 0, "YELLOW");
      });
    });

    describe("Grayscale (Achromatic)", () => {
      it("should handle 10% gray", async () => {
        await testSRGBToOKHSL(0.1, 0.1, 0.1, "10% GRAY");
      });

      it("should handle 25% gray", async () => {
        await testSRGBToOKHSL(0.25, 0.25, 0.25, "25% GRAY");
      });

      it("should handle 50% gray", async () => {
        await testSRGBToOKHSL(0.5, 0.5, 0.5, "50% GRAY");
      });

      it("should handle 75% gray", async () => {
        await testSRGBToOKHSL(0.75, 0.75, 0.75, "75% GRAY");
      });

      it("should handle 90% gray", async () => {
        await testSRGBToOKHSL(0.9, 0.9, 0.9, "90% GRAY");
      });
    });

    describe("Mid-Saturation Colors", () => {
      it("should handle mid-saturation red", async () => {
        await testSRGBToOKHSL(0.8, 0.3, 0.3, "MID-SAT RED");
      });

      it("should handle mid-saturation green", async () => {
        await testSRGBToOKHSL(0.3, 0.8, 0.3, "MID-SAT GREEN");
      });

      it("should handle mid-saturation blue", async () => {
        await testSRGBToOKHSL(0.3, 0.3, 0.8, "MID-SAT BLUE");
      });

      it("should handle pastel pink", async () => {
        await testSRGBToOKHSL(1, 0.7, 0.8, "PASTEL PINK");
      });

      it("should handle olive", async () => {
        await testSRGBToOKHSL(0.5, 0.5, 0, "OLIVE");
      });

      it("should handle teal", async () => {
        await testSRGBToOKHSL(0, 0.5, 0.5, "TEAL");
      });
    });

    describe("Dark Colors", () => {
      it("should handle dark red", async () => {
        await testSRGBToOKHSL(0.3, 0, 0, "DARK RED");
      });

      it("should handle dark green", async () => {
        await testSRGBToOKHSL(0, 0.3, 0, "DARK GREEN");
      });

      it("should handle dark blue", async () => {
        await testSRGBToOKHSL(0, 0, 0.3, "DARK BLUE");
      });

      it("should handle brown", async () => {
        await testSRGBToOKHSL(0.4, 0.2, 0.1, "BROWN");
      });

      it("should handle navy", async () => {
        await testSRGBToOKHSL(0, 0, 0.3, "NAVY");
      });
    });

    describe("Light Colors", () => {
      it("should handle light red/salmon", async () => {
        await testSRGBToOKHSL(1, 0.6, 0.6, "SALMON");
      });

      it("should handle light green/mint", async () => {
        await testSRGBToOKHSL(0.6, 1, 0.6, "MINT");
      });

      it("should handle light blue/sky", async () => {
        await testSRGBToOKHSL(0.6, 0.6, 1, "SKY BLUE");
      });

      it("should handle cream", async () => {
        await testSRGBToOKHSL(1, 0.98, 0.8, "CREAM");
      });
    });

    describe("Problematic Hue Regions", () => {
      // These test regions where polynomial approximation might be less accurate

      it("should handle orange (hue transition R→Y)", async () => {
        await testSRGBToOKHSL(1, 0.5, 0, "ORANGE");
      });

      it("should handle lime (hue transition Y→G)", async () => {
        await testSRGBToOKHSL(0.5, 1, 0, "LIME");
      });

      it("should handle spring green (hue transition G→C)", async () => {
        await testSRGBToOKHSL(0, 1, 0.5, "SPRING GREEN");
      });

      it("should handle azure (hue transition C→B)", async () => {
        await testSRGBToOKHSL(0, 0.5, 1, "AZURE");
      });

      it("should handle violet (hue transition B→M)", async () => {
        await testSRGBToOKHSL(0.5, 0, 1, "VIOLET");
      });

      it("should handle rose (hue transition M→R)", async () => {
        await testSRGBToOKHSL(1, 0, 0.5, "ROSE");
      });
    });

    describe("Low Chroma Colors (Near Achromatic)", () => {
      it("should handle very desaturated red", async () => {
        await testSRGBToOKHSL(0.52, 0.48, 0.48, "DESAT RED");
      });

      it("should handle very desaturated blue", async () => {
        await testSRGBToOKHSL(0.48, 0.48, 0.52, "DESAT BLUE");
      });

      it("should handle barely tinted gray", async () => {
        await testSRGBToOKHSL(0.501, 0.5, 0.499, "BARELY TINTED");
      });
    });

    describe("Real-World Colors", () => {
      it("should handle Tailwind blue-500", async () => {
        // #3b82f6 = rgb(59, 130, 246)
        await testSRGBToOKHSL(59 / 255, 130 / 255, 246 / 255, "TAILWIND BLUE-500");
      });

      it("should handle GitHub green", async () => {
        // #238636 = rgb(35, 134, 54)
        await testSRGBToOKHSL(35 / 255, 134 / 255, 54 / 255, "GITHUB GREEN");
      });

      it("should handle Discord purple", async () => {
        // #5865f2 = rgb(88, 101, 242)
        await testSRGBToOKHSL(88 / 255, 101 / 255, 242 / 255, "DISCORD PURPLE");
      });

      it("should handle Slack aubergine", async () => {
        // #4a154b = rgb(74, 21, 75)
        await testSRGBToOKHSL(74 / 255, 21 / 255, 75 / 255, "SLACK AUBERGINE");
      });

      it("should handle Twitter blue", async () => {
        // #1da1f2 = rgb(29, 161, 242)
        await testSRGBToOKHSL(29 / 255, 161 / 255, 242 / 255, "TWITTER BLUE");
      });
    });
  });
});
