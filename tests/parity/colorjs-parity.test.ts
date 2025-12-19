/**
 * ColorJS Parity Tests
 *
 * These tests verify that our TokenScript color conversions match ColorJS
 * within acceptable tolerance. This ensures users migrating from ColorJS
 * will get consistent results.
 */

import { describe, expect, it } from "vitest";
import Color from "colorjs.io";
import {
  TEST_COLORS,
  SPACE_MAPPINGS,
  SPACE_COORDS,
  compareCoords,
  DEFAULT_TOLERANCE,
  SPACE_TOLERANCES,
  findConversionPath,
  getAllConversionPaths,
  CONVERSION_GRAPH,
  generateMermaidGraph,
  visualizePath,
} from "@tests/helpers/colorjs-parity";

describe("ColorJS Parity", () => {
  describe("Reference: ColorJS Conversion Graph", () => {
    it("should have all expected color spaces in ColorJS", () => {
      // Verify ColorJS supports all the spaces we want to implement
      const spaces = Object.values(SPACE_MAPPINGS);

      for (const space of spaces) {
        expect(() => {
          new Color(space, [0.5, 0.5, 0.5]);
        }).not.toThrow();
      }
    });

    it("should find conversion paths between all spaces", () => {
      // Verify our conversion graph is fully connected
      for (const fromNode of CONVERSION_GRAPH) {
        for (const toNode of CONVERSION_GRAPH) {
          const path = findConversionPath(fromNode.space, toNode.space);
          expect(path).not.toBeNull();
          expect(path![0]).toBe(fromNode.space);
          expect(path![path!.length - 1]).toBe(toNode.space);
        }
      }
    });

    it("should generate valid mermaid diagram", () => {
      const diagram = generateMermaidGraph();
      expect(diagram).toContain("graph TD");
      expect(diagram).toContain("srgb");
      expect(diagram).toContain("xyz-d65");
    });
  });

  describe("ColorJS Reference Values", () => {
    describe("sRGB Primary Colors", () => {
      it("should convert red through all spaces", () => {
        const red = new Color("srgb", [1, 0, 0]);

        // Test key conversions
        const asOklab = red.to("oklab");
        expect(asOklab.coords[0]).toBeCloseTo(0.628, 2); // L
        expect(asOklab.coords[1]).toBeCloseTo(0.225, 2); // a
        expect(asOklab.coords[2]).toBeCloseTo(0.126, 2); // b

        const asLab = red.to("lab");
        expect(asLab.coords[0]).toBeCloseTo(54.3, 0); // L
        expect(asLab.coords[1]).toBeCloseTo(80.8, 0); // a
        expect(asLab.coords[2]).toBeCloseTo(69.9, 0); // b

        const asHsl = red.to("hsl");
        expect(asHsl.coords[0]).toBeCloseTo(0, 0); // H
        expect(asHsl.coords[1]).toBeCloseTo(100, 0); // S
        expect(asHsl.coords[2]).toBeCloseTo(50, 0); // L
      });

      it("should convert green through all spaces", () => {
        const green = new Color("srgb", [0, 1, 0]);

        const asOklab = green.to("oklab");
        expect(asOklab.coords[0]).toBeCloseTo(0.866, 2); // L
        expect(asOklab.coords[1]).toBeCloseTo(-0.234, 2); // a
        expect(asOklab.coords[2]).toBeCloseTo(0.179, 2); // b
      });

      it("should convert blue through all spaces", () => {
        const blue = new Color("srgb", [0, 0, 1]);

        const asOklab = blue.to("oklab");
        expect(asOklab.coords[0]).toBeCloseTo(0.452, 2); // L
        expect(asOklab.coords[1]).toBeCloseTo(-0.032, 2); // a
        expect(asOklab.coords[2]).toBeCloseTo(-0.312, 2); // b
      });
    });

    describe("Round-trip Precision", () => {
      it("should maintain precision in sRGB → OKLab → sRGB round-trip", () => {
        const colors = [
          [1, 0, 0], // red
          [0, 1, 0], // green
          [0, 0, 1], // blue
          [0.5, 0.5, 0.5], // gray
          [0.2, 0.4, 0.8], // random
        ];

        for (const coords of colors) {
          const original = new Color("srgb", coords);
          const asOklab = original.to("oklab");
          const backToSrgb = asOklab.to("srgb");

          const { matches, maxDifference } = compareCoords(
            { r: backToSrgb.coords[0], g: backToSrgb.coords[1], b: backToSrgb.coords[2] },
            { r: coords[0], g: coords[1], b: coords[2] },
            DEFAULT_TOLERANCE,
          );

          expect(matches).toBe(true);
          expect(maxDifference).toBeLessThan(DEFAULT_TOLERANCE);
        }
      });

      it("should maintain precision in long round-trip sRGB → XYZ → Lab → LCH → Lab → XYZ → sRGB", () => {
        const original = new Color("srgb", [0.7, 0.3, 0.5]);

        const asXyz = original.to("xyz-d65");
        const asXyzD50 = asXyz.to("xyz-d50");
        const asLab = asXyzD50.to("lab");
        const asLch = asLab.to("lch");
        const backToLab = asLch.to("lab");
        const backToXyzD50 = backToLab.to("xyz-d50");
        const backToXyz = backToXyzD50.to("xyz-d65");
        const backToSrgb = backToXyz.to("srgb-linear").to("srgb");

        const { maxDifference } = compareCoords(
          { r: backToSrgb.coords[0], g: backToSrgb.coords[1], b: backToSrgb.coords[2] },
          { r: 0.7, g: 0.3, b: 0.5 },
          DEFAULT_TOLERANCE,
        );

        // Long round-trips accumulate error, but should still be small
        expect(maxDifference).toBeLessThan(1e-4);
      });

      it("should maintain precision through OKLab → OKLCH → OKLab round-trip", () => {
        // Test the polar/cartesian conversion
        const oklab = new Color("oklab", [0.7, 0.1, -0.1]);
        const asOklch = oklab.to("oklch");
        const backToOklab = asOklch.to("oklab");

        expect(backToOklab.coords[0]).toBeCloseTo(oklab.coords[0], 10);
        expect(backToOklab.coords[1]).toBeCloseTo(oklab.coords[1], 10);
        expect(backToOklab.coords[2]).toBeCloseTo(oklab.coords[2], 10);
      });
    });

    describe("Edge Cases", () => {
      it("should handle black correctly", () => {
        const black = new Color("srgb", [0, 0, 0]);

        const asOklab = black.to("oklab");
        expect(asOklab.coords[0]).toBeCloseTo(0, 5); // L = 0
        expect(asOklab.coords[1]).toBeCloseTo(0, 5); // a = 0
        expect(asOklab.coords[2]).toBeCloseTo(0, 5); // b = 0

        const asLab = black.to("lab");
        expect(asLab.coords[0]).toBeCloseTo(0, 5); // L = 0
      });

      it("should handle white correctly", () => {
        const white = new Color("srgb", [1, 1, 1]);

        const asOklab = white.to("oklab");
        expect(asOklab.coords[0]).toBeCloseTo(1, 5); // L = 1

        const asLab = white.to("lab");
        expect(asLab.coords[0]).toBeCloseTo(100, 1); // L = 100
      });

      it("should handle neutral grays (no hue)", () => {
        const gray = new Color("srgb", [0.5, 0.5, 0.5]);

        const asOklab = gray.to("oklab");
        // For neutral grays, a and b should be very close to 0
        expect(Math.abs(asOklab.coords[1])).toBeLessThan(1e-5);
        expect(Math.abs(asOklab.coords[2])).toBeLessThan(1e-5);

        const asOklch = gray.to("oklch");
        // Chroma should be 0 for neutral grays
        expect(asOklch.coords[1]).toBeLessThan(1e-5);
      });

      it("should handle very small color differences", () => {
        const color1 = new Color("srgb", [0.5, 0.5, 0.5]);
        const color2 = new Color("srgb", [0.500001, 0.5, 0.5]);

        const oklab1 = color1.to("oklab");
        const oklab2 = color2.to("oklab");

        // Should detect the small difference
        const diff = Math.abs(oklab1.coords[0] - oklab2.coords[0]);
        expect(diff).toBeGreaterThan(0);
        expect(diff).toBeLessThan(1e-4);
      });
    });

    describe("Gamma Correction", () => {
      it("should correctly apply sRGB gamma", () => {
        // Test the gamma threshold (0.04045)
        const belowThreshold = new Color("srgb", [0.03, 0.03, 0.03]);
        const linear = belowThreshold.to("srgb-linear");

        // Below threshold: linear = srgb / 12.92
        expect(linear.coords[0]).toBeCloseTo(0.03 / 12.92, 10);

        const aboveThreshold = new Color("srgb", [0.5, 0.5, 0.5]);
        const linearAbove = aboveThreshold.to("srgb-linear");

        // Above threshold: linear = ((srgb + 0.055) / 1.055) ^ 2.4
        const expected = Math.pow((0.5 + 0.055) / 1.055, 2.4);
        expect(linearAbove.coords[0]).toBeCloseTo(expected, 10);
      });
    });

    describe("Chromatic Adaptation (D65 ↔ D50)", () => {
      it("should correctly adapt XYZ-D65 to XYZ-D50", () => {
        const d65White = new Color("xyz-d65", [0.95047, 1.0, 1.08883]); // D65 white point
        const asD50 = d65White.to("xyz-d50");

        // D50 white point should be [0.9642, 1.0, 0.8249]
        expect(asD50.coords[0]).toBeCloseTo(0.9642, 3);
        expect(asD50.coords[1]).toBeCloseTo(1.0, 5);
        expect(asD50.coords[2]).toBeCloseTo(0.8249, 3);
      });
    });
  });

  describe("Conversion Path Visualization", () => {
    it("should visualize all paths from sRGB", () => {
      const paths = getAllConversionPaths("srgb");

      console.log("\n=== All conversion paths from sRGB ===\n");
      for (const [target, path] of paths) {
        console.log(`  ${visualizePath(path)}`);
      }
      console.log("");

      // Verify we can reach all spaces
      expect(paths.size).toBe(CONVERSION_GRAPH.length);
    });

    it("should show full conversion graph", () => {
      console.log("\n=== Conversion Graph (Mermaid) ===\n");
      console.log(generateMermaidGraph());
      console.log("");
    });
  });

  describe("Reference Data Generation", () => {
    it("should generate reference values for test colors", () => {
      console.log("\n=== ColorJS Reference Values for Testing ===\n");

      for (const [name, { space, coords }] of Object.entries(TEST_COLORS)) {
        const color = new Color(space, coords);

        console.log(`\n${name.toUpperCase()} (${space}: [${coords.join(", ")}]):`);

        // Show conversions to key spaces
        const keySpaces = ["srgb", "oklab", "oklch", "lab", "lch", "xyz-d65"];
        for (const targetSpace of keySpaces) {
          try {
            const converted = color.to(targetSpace);
            const coordNames = SPACE_COORDS[targetSpace] || ["c1", "c2", "c3"];
            const values = coordNames
              .map((name, i) => `${name}: ${converted.coords[i].toFixed(6)}`)
              .join(", ");
            console.log(`  → ${targetSpace}: { ${values} }`);
          } catch (e) {
            console.log(`  → ${targetSpace}: [conversion failed]`);
          }
        }
      }

      console.log("");
    });
  });
});

describe("TokenScript Parity Tests (Placeholder)", () => {
  // These tests will be filled in as we implement each color space

  it.skip("should match ColorJS for sRGB → Linear sRGB conversion", async () => {
    // TODO: Implement when srgb-color and srgb-linear-color schemas exist
    // const result = await executeWithSchema("srgb-linear-color", "type", `
    //   variable c: Color.SRGB;
    //   c.r = 0.5;
    //   c.g = 0.5;
    //   c.b = 0.5;
    //   c.to.linearsrgb()
    // `);
    //
    // const colorJS = new Color("srgb", [0.5, 0.5, 0.5]).to("srgb-linear");
    // expect(result.value.r.value).toBeCloseTo(colorJS.coords[0], 5);
  });

  it.skip("should match ColorJS for Linear sRGB → XYZ-D65 conversion", async () => {
    // TODO: Implement when xyz-d65-color schema exists
  });

  it.skip("should match ColorJS for XYZ-D65 → OKLab conversion", async () => {
    // TODO: Implement when oklab-color schema exists
  });

  it.skip("should match ColorJS for full sRGB → OKLab round-trip", async () => {
    // TODO: Implement when full conversion chain exists
  });
});

