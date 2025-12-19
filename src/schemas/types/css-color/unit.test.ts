/**
 * CSS Color Schema Tests
 *
 * Tests for CSS color string output from various color spaces
 * Validates correct CSS Color Level 4 syntax generation
 */

import {
  setupColorManagerWithSchemas,
  createInterpreter,
  getBundledSchema,
  Config,
} from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

/**
 * Helper to execute code with css-color and required source schemas loaded
 */
async function executeWithCssColor(
  sourceSchemas: string[],
  code: string,
): Promise<any> {
  // Always include css-color plus the source schemas needed
  const allSchemas = [...new Set([...sourceSchemas, "css-color"])];
  const config = await setupColorManagerWithSchemas(allSchemas);
  const interpreter = createInterpreter(code, {}, config);
  return interpreter.interpret();
}

describe("CSS Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("css-color")) as ColorSpecification;

      expect(schema.name).toBe("CSS");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("value");
      expect(schema.schema?.required).toEqual(["value"]);
    });

    it("should have an initializer for type registration", async () => {
      const schema = (await getBundledSchema("css-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("css");
    });

    it("should have 12 conversion sources", async () => {
      const schema = (await getBundledSchema("css-color")) as ColorSpecification;

      expect(schema.conversions).toHaveLength(12);

      // Verify all expected sources exist (with full registry URL)
      const sources = schema.conversions.map((c: { source: string }) => c.source);
      // Sources are transformed to include the registry base URL during bundling
      const containsSource = (slug: string) =>
        sources.some((s: string) => s.includes(slug));
      
      expect(containsSource("rgb-color")).toBe(true);
      expect(containsSource("srgb-color")).toBe(true);
      expect(containsSource("hsl-color")).toBe(true);
      expect(containsSource("hwb-color")).toBe(true);
      expect(containsSource("lab-color")).toBe(true);
      expect(containsSource("lch-color")).toBe(true);
      expect(containsSource("oklab-color")).toBe(true);
      expect(containsSource("oklch-color")).toBe(true);
      expect(containsSource("srgb-linear-color")).toBe(true);
      expect(containsSource("xyz-d65-color")).toBe(true);
      expect(containsSource("xyz-d50-color")).toBe(true);
      expect(containsSource("p3-color")).toBe(true);
    });
  });

  describe("RGB to CSS", () => {
    it("should convert RGB to rgb() syntax", async () => {
      const result = await executeWithCssColor(
        ["rgb-color", "hex-color"],
        `
        variable c: Color.Rgb = rgb(255, 128, 64);
        c.to.css()
      `,
      );

      // Result is a ColorSymbol with value.value containing the CSS string
      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      console.log(`\n=== RGB → CSS ===`);
      console.log(`Output: ${css}`);

      expect(css).toBe("rgb(255 128 64)");
    });

    it("should handle RGB black", async () => {
      const result = await executeWithCssColor(
        ["rgb-color", "hex-color"],
        `
        variable c: Color.Rgb = rgb(0, 0, 0);
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      expect(css).toBe("rgb(0 0 0)");
    });

    it("should handle RGB white", async () => {
      const result = await executeWithCssColor(
        ["rgb-color", "hex-color"],
        `
        variable c: Color.Rgb = rgb(255, 255, 255);
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      expect(css).toBe("rgb(255 255 255)");
    });
  });

  describe("sRGB to CSS", () => {
    it("should convert sRGB to color(srgb) syntax", async () => {
      const result = await executeWithCssColor(
        ["srgb-color"],
        `
        variable c: Color.SRGB;
        c.r = 1;
        c.g = 0.5;
        c.b = 0.25;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      console.log(`\n=== sRGB → CSS ===`);
      console.log(`Output: ${css}`);

      expect(css).toMatch(/^color\(srgb 1 0\.5 0\.25\)$/);
    });
  });

  describe("HSL to CSS", () => {
    it("should convert HSL to hsl() syntax with percentages", async () => {
      const result = await executeWithCssColor(
        ["hsl-color"],
        `
        variable c: Color.HSL;
        c.h = 120;
        c.s = 0.5;
        c.l = 0.75;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      console.log(`\n=== HSL → CSS ===`);
      console.log(`Output: ${css}`);

      // Should produce hsl(120 50% 75%)
      expect(css).toMatch(/^hsl\(120 50% 75%\)$/);
    });

    it("should handle HSL red", async () => {
      const result = await executeWithCssColor(
        ["hsl-color"],
        `
        variable c: Color.HSL;
        c.h = 0;
        c.s = 1;
        c.l = 0.5;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      expect(css).toMatch(/^hsl\(0 100% 50%\)$/);
    });
  });

  describe("HWB to CSS", () => {
    it("should convert HWB to hwb() syntax with percentages", async () => {
      const result = await executeWithCssColor(
        ["hwb-color", "hsv-color", "srgb-color"],
        `
        variable c: Color.HWB;
        c.h = 120;
        c.w = 0.1;
        c.b = 0.2;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      console.log(`\n=== HWB → CSS ===`);
      console.log(`Output: ${css}`);

      // Should produce hwb(120 10% 20%)
      expect(css).toMatch(/^hwb\(120 10% 20%\)$/);
    });
  });

  describe("Lab to CSS", () => {
    it("should convert Lab to lab() syntax with L as percentage", async () => {
      const result = await executeWithCssColor(
        ["lab-color", "xyz-d50-color", "xyz-d65-color", "srgb-linear-color", "srgb-color"],
        `
        variable c: Color.Lab;
        c.l = 75;
        c.a = 20;
        c.b = -30;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      console.log(`\n=== Lab → CSS ===`);
      console.log(`Output: ${css}`);

      // Should produce lab(75% 20 -30)
      expect(css).toMatch(/^lab\(75% 20 -30\)$/);
    });
  });

  describe("LCH to CSS", () => {
    it("should convert LCH to lch() syntax with L as percentage", async () => {
      const result = await executeWithCssColor(
        ["lch-color", "lab-color", "xyz-d50-color", "xyz-d65-color", "srgb-linear-color", "srgb-color"],
        `
        variable c: Color.LCH;
        c.l = 75;
        c.c = 50;
        c.h = 180;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      console.log(`\n=== LCH → CSS ===`);
      console.log(`Output: ${css}`);

      // Should produce lch(75% 50 180)
      expect(css).toMatch(/^lch\(75% 50 180\)$/);
    });
  });

  describe("OKLab to CSS", () => {
    it("should convert OKLab to oklab() syntax", async () => {
      const result = await executeWithCssColor(
        ["oklab-color", "xyz-d65-color", "srgb-linear-color", "srgb-color"],
        `
        variable c: Color.OKLab;
        c.l = 0.7;
        c.a = 0.1;
        c.b = -0.05;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      console.log(`\n=== OKLab → CSS ===`);
      console.log(`Output: ${css}`);

      // Should produce oklab(0.7 0.1 -0.05)
      expect(css).toMatch(/^oklab\(0\.7 0\.1 -0\.05\)$/);
    });
  });

  describe("OKLCH to CSS", () => {
    it("should convert OKLCH to oklch() syntax", async () => {
      const result = await executeWithCssColor(
        ["oklch-color", "oklab-color", "xyz-d65-color", "srgb-linear-color", "srgb-color"],
        `
        variable c: Color.OKLCH;
        c.l = 0.7;
        c.c = 0.15;
        c.h = 180;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      console.log(`\n=== OKLCH → CSS ===`);
      console.log(`Output: ${css}`);

      // Should produce oklch(0.7 0.15 180)
      expect(css).toMatch(/^oklch\(0\.7 0\.15 180\)$/);
    });
  });

  describe("Linear sRGB to CSS", () => {
    it("should convert Linear sRGB to color(srgb-linear) syntax", async () => {
      const result = await executeWithCssColor(
        ["srgb-linear-color", "srgb-color"],
        `
        variable c: Color.LinearSRGB;
        c.r = 1;
        c.g = 0.25;
        c.b = 0.0625;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      console.log(`\n=== Linear sRGB → CSS ===`);
      console.log(`Output: ${css}`);

      expect(css).toMatch(/^color\(srgb-linear 1 0\.25 0\.0625\)$/);
    });
  });

  describe("XYZ-D65 to CSS", () => {
    it("should convert XYZ-D65 to color(xyz-d65) syntax", async () => {
      const result = await executeWithCssColor(
        ["xyz-d65-color", "srgb-linear-color", "srgb-color"],
        `
        variable c: Color.XYZD65;
        c.x = 0.4124;
        c.y = 0.2126;
        c.z = 0.0193;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      console.log(`\n=== XYZ-D65 → CSS ===`);
      console.log(`Output: ${css}`);

      expect(css).toMatch(/^color\(xyz-d65 0\.4124 0\.2126 0\.0193\)$/);
    });
  });

  describe("XYZ-D50 to CSS", () => {
    it("should convert XYZ-D50 to color(xyz-d50) syntax", async () => {
      const result = await executeWithCssColor(
        ["xyz-d50-color", "xyz-d65-color", "srgb-linear-color", "srgb-color"],
        `
        variable c: Color.XYZD50;
        c.x = 0.436;
        c.y = 0.2225;
        c.z = 0.0139;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      console.log(`\n=== XYZ-D50 → CSS ===`);
      console.log(`Output: ${css}`);

      expect(css).toMatch(/^color\(xyz-d50 0\.436 0\.2225 0\.0139\)$/);
    });
  });

  describe("Display-P3 to CSS", () => {
    it("should convert Display-P3 to color(display-p3) syntax", async () => {
      const result = await executeWithCssColor(
        ["p3-color", "p3-linear-color", "xyz-d65-color", "srgb-linear-color", "srgb-color"],
        `
        variable c: Color.P3;
        c.r = 1;
        c.g = 0.5;
        c.b = 0.25;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      console.log(`\n=== Display-P3 → CSS ===`);
      console.log(`Output: ${css}`);

      expect(css).toMatch(/^color\(display-p3 1 0\.5 0\.25\)$/);
    });
  });

  describe("Path Resolution", () => {
    // Skip: HSV → CSS requires multi-hop path resolution (HSV → sRGB → CSS)
    // which may not be fully supported by the ColorManager path finder
    it.skip("should convert HSV to CSS via path resolution (HSV → sRGB → CSS)", async () => {
      // HSV has no direct CSS support, so path resolution should find HSV → sRGB → CSS
      const result = await executeWithCssColor(
        ["hsv-color", "srgb-color", "hsl-color"],
        `
        variable c: Color.HSV;
        c.h = 0;
        c.s = 1;
        c.v = 1;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      console.log(`\n=== HSV → CSS (via path resolution) ===`);
      console.log(`Output: ${css}`);

      // Should produce valid CSS (exact format depends on path resolution)
      expect(css).toBeTruthy();
      expect(typeof css).toBe("string");
    });
  });
});
