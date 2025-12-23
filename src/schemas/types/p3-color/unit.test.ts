/**
 * Display-P3 Color Schema Tests
 */

import { log } from "@tests/helpers/logger";
import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

describe("Display-P3 Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("p3-color")) as ColorSpecification;

      expect(schema.name).toBe("P3");
      expect(schema.type).toBe("color");
      expect(schema.schema?.properties).toHaveProperty("r");
      expect(schema.schema?.properties).toHaveProperty("g");
      expect(schema.schema?.properties).toHaveProperty("b");
    });
  });

  describe("Conversion from Linear P3", () => {
    const testCases = [
      { name: "black", linear: [0, 0, 0] },
      { name: "white", linear: [1, 1, 1] },
      { name: "mid-gray", linear: [0.214, 0.214, 0.214] },
      { name: "P3 red", linear: [1, 0, 0] },
      { name: "P3 green", linear: [0, 1, 0] },
    ];

    for (const { name, linear } of testCases) {
      it(`should apply gamma encoding for ${name}`, async () => {
        const result = await executeWithSchema(
          "p3-color",
          "type",
          `
          variable linear: Color.LinearP3;
          linear.r = ${linear[0]}; linear.g = ${linear[1]}; linear.b = ${linear[2]};
          linear.to.p3()
        `,
        );

        // ColorJS reference
        const colorJS = new Color("p3-linear", linear as [number, number, number]).to("p3");

        const tsR = (result as any).value.r.value;
        const tsG = (result as any).value.g.value;
        const tsB = (result as any).value.b.value;

        expect(tsR).toBeCloseTo(colorJS.coords[0], 8);
        expect(tsG).toBeCloseTo(colorJS.coords[1], 8);
        expect(tsB).toBeCloseTo(colorJS.coords[2], 8);
      });
    }
  });

  describe("Full Conversion Chain: sRGB → P3", () => {
    it("should convert sRGB red through to P3", async () => {
      // sRGB red converted to P3 should have slightly lower values
      // because P3 has a wider gamut
      const result = await executeWithSchema(
        "p3-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1; srgb.g = 0; srgb.b = 0;
        variable linear_srgb: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz: Color.XYZD65 = linear_srgb.to.xyzd65();
        variable linear_p3: Color.LinearP3 = xyz.to.linearp3();
        linear_p3.to.p3()
      `,
      );

      // ColorJS reference
      const colorJS = new Color("srgb", [1, 0, 0]).to("p3");

      const tsR = (result as any).value.r.value;
      const tsG = (result as any).value.g.value;
      const tsB = (result as any).value.b.value;

      log.info(`\n=== sRGB Red → P3 ===`);
      log.info(`TokenScript: { r: ${tsR.toFixed(6)}, g: ${tsG.toFixed(6)}, b: ${tsB.toFixed(6)} }`);
      log.info(
        `ColorJS:     { r: ${colorJS.coords[0].toFixed(6)}, g: ${colorJS.coords[1].toFixed(6)}, b: ${colorJS.coords[2].toFixed(6)} }`,
      );

      expect(tsR).toBeCloseTo(colorJS.coords[0], 8);
      expect(tsG).toBeCloseTo(colorJS.coords[1], 8);
      expect(tsB).toBeCloseTo(colorJS.coords[2], 8);
    });

    it("should demonstrate P3 has wider gamut than sRGB", async () => {
      // When converting sRGB colors to P3, they will be "pulled in"
      // because P3 has a larger gamut - sRGB red is less saturated in P3 space
      const colorJS_srgbRed = new Color("srgb", [1, 0, 0]).to("p3");

      // sRGB red (1, 0, 0) in P3 space should have r < 1
      // because P3 red is more saturated
      log.info(`\n=== sRGB Red expressed in P3 ===`);
      log.info(
        `P3: { r: ${colorJS_srgbRed.coords[0].toFixed(6)}, g: ${colorJS_srgbRed.coords[1].toFixed(6)}, b: ${colorJS_srgbRed.coords[2].toFixed(6)} }`,
      );
      log.info(`Note: R < 1 because P3 red primary is more saturated than sRGB red`);

      // P3 green primary is way outside sRGB gamut
      const colorJS_p3Green = new Color("p3", [0, 1, 0]).to("srgb");
      log.info(`\n=== P3 Green expressed in sRGB (clipped) ===`);
      log.info(
        `sRGB: { r: ${colorJS_p3Green.coords[0].toFixed(6)}, g: ${colorJS_p3Green.coords[1].toFixed(6)}, b: ${colorJS_p3Green.coords[2].toFixed(6)} }`,
      );
      log.info(`Note: Negative R value indicates out-of-sRGB-gamut color`);

      // P3 green in sRGB space has negative red
      expect(colorJS_p3Green.coords[0]).toBeLessThan(0);
    });
  });
});
