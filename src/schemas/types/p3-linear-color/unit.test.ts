/**
 * Linear P3 Color Schema Tests
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

describe("Linear P3 Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("p3-linear-color")) as ColorSpecification;

      expect(schema.name).toBe("LinearP3");
      expect(schema.type).toBe("color");
      expect(schema.schema?.properties).toHaveProperty("r");
      expect(schema.schema?.properties).toHaveProperty("g");
      expect(schema.schema?.properties).toHaveProperty("b");
    });
  });

  describe("Conversion from XYZ-D65", () => {
    const testCases = [
      { name: "red", xyz: [0.4124564, 0.2126729, 0.0193339] },
      { name: "green", xyz: [0.3575761, 0.7151522, 0.119192] },
      { name: "blue", xyz: [0.1804375, 0.072175, 0.9505041] },
      { name: "white", xyz: [0.95047, 1.0, 1.08883] },
      { name: "P3 green primary", xyz: [0.2657, 0.6918, 0.0451] },
    ];

    for (const { name, xyz } of testCases) {
      it(`should convert XYZ-D65 to Linear P3 for ${name}`, async () => {
        const result = await executeWithSchema(
          "p3-linear-color",
          "type",
          `
          variable xyz: Color.XYZD65;
          xyz.x = ${xyz[0]}; xyz.y = ${xyz[1]}; xyz.z = ${xyz[2]};
          xyz.to.linearp3()
        `,
        );

        // ColorJS reference
        const colorJS = new Color("xyz-d65", xyz as [number, number, number]).to("p3-linear");

        const tsR = (result as any).value.r.value;
        const tsG = (result as any).value.g.value;
        const tsB = (result as any).value.b.value;

        expect(tsR).toBeCloseTo(colorJS.coords[0], 8);
        expect(tsG).toBeCloseTo(colorJS.coords[1], 8);
        expect(tsB).toBeCloseTo(colorJS.coords[2], 8);
      });
    }
  });

  describe("Wide Gamut Colors", () => {
    it("should handle P3 colors outside sRGB gamut", async () => {
      // P3's green primary has negative sRGB values
      const result = await executeWithSchema(
        "p3-linear-color",
        "type",
        `
        variable xyz: Color.XYZD65;
        xyz.x = 0.2657; xyz.y = 0.6918; xyz.z = 0.0451;
        xyz.to.linearp3()
      `,
      );

      // This should give us approximately (0, 1, 0) in Linear P3
      const tsR = (result as any).value.r.value;
      const tsG = (result as any).value.g.value;
      const tsB = (result as any).value.b.value;

      // P3 green primary should be close to (0, 1, 0)
      expect(tsG).toBeCloseTo(1, 1);
      expect(Math.abs(tsR)).toBeLessThan(0.1);
      expect(Math.abs(tsB)).toBeLessThan(0.1);
    });
  });
});
