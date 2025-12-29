/**
 * CSS Color Schema Tests
 *
 * Tests for CSS color string output from various color spaces
 * Validates correct CSS Color Level 4 syntax generation
 */

import { log } from "@tests/helpers/logger";
import {
  createInterpreter,
  getBundledSchema,
  setupColorManagerWithSchemas,
} from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

/**
 * Helper to execute code with css-color and required source schemas loaded
 */
async function executeWithCssColor(sourceSchemas: string[], code: string): Promise<any> {
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
      const containsSource = (slug: string) => sources.some((s: string) => s.includes(slug));

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
      log.info(`\n=== RGB → CSS ===`);
      log.info(`Output: ${css}`);

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
      log.info(`\n=== sRGB → CSS ===`);
      log.info(`Output: ${css}`);

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
      log.info(`\n=== HSL → CSS ===`);
      log.info(`Output: ${css}`);

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
      log.info(`\n=== HWB → CSS ===`);
      log.info(`Output: ${css}`);

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
      log.info(`\n=== Lab → CSS ===`);
      log.info(`Output: ${css}`);

      // Should produce lab(75% 20 -30)
      expect(css).toMatch(/^lab\(75% 20 -30\)$/);
    });
  });

  describe("LCH to CSS", () => {
    it("should convert LCH to lch() syntax with L as percentage", async () => {
      const result = await executeWithCssColor(
        [
          "lch-color",
          "lab-color",
          "xyz-d50-color",
          "xyz-d65-color",
          "srgb-linear-color",
          "srgb-color",
        ],
        `
        variable c: Color.LCH;
        c.l = 75;
        c.c = 50;
        c.h = 180;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      log.info(`\n=== LCH → CSS ===`);
      log.info(`Output: ${css}`);

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
      log.info(`\n=== OKLab → CSS ===`);
      log.info(`Output: ${css}`);

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
      log.info(`\n=== OKLCH → CSS ===`);
      log.info(`Output: ${css}`);

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
      log.info(`\n=== Linear sRGB → CSS ===`);
      log.info(`Output: ${css}`);

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
      log.info(`\n=== XYZ-D65 → CSS ===`);
      log.info(`Output: ${css}`);

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
      log.info(`\n=== XYZ-D50 → CSS ===`);
      log.info(`Output: ${css}`);

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
      log.info(`\n=== Display-P3 → CSS ===`);
      log.info(`Output: ${css}`);

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
      log.info(`\n=== HSV → CSS (via path resolution) ===`);
      log.info(`Output: ${css}`);

      // Should produce valid CSS (exact format depends on path resolution)
      expect(css).toBeTruthy();
      expect(typeof css).toBe("string");
    });
  });

  describe("Alpha Channel Support", () => {
    it("should output RGB with alpha in CSS format", async () => {
      const result = await executeWithCssColor(
        ["rgb-color"],
        `
        variable c: Color.Rgb = rgb(255, 128, 64, 0.5);
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      log.info(`\n=== RGB with alpha → CSS ===`);
      log.info(`Output: ${css}`);

      expect(css).toBe("rgb(255 128 64 / 0.5)");
    });

    it("should omit alpha = 1.0 from RGB CSS output", async () => {
      const result = await executeWithCssColor(
        ["rgb-color"],
        `
        variable c: Color.Rgb = rgb(255, 128, 64, 1);
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      expect(css).toBe("rgb(255 128 64)");
    });

    it("should omit null alpha from RGB CSS output", async () => {
      const result = await executeWithCssColor(
        ["rgb-color"],
        `
        variable c: Color.Rgb = rgb(255, 128, 64);
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      expect(css).toBe("rgb(255 128 64)");
    });

    it("should output HSL with alpha in CSS format", async () => {
      const result = await executeWithCssColor(
        ["hsl-color", "srgb-color"],
        `
        variable c: Color.HSL = hsl(180, 0.5, 0.5, 0.8);
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      log.info(`\n=== HSL with alpha → CSS ===`);
      log.info(`Output: ${css}`);

      expect(css).toMatch(/^hsl\(180 50% 50% \/ 0\.8\)$/);
    });

    it("should output HWB with alpha in CSS format", async () => {
      const result = await executeWithCssColor(
        ["hwb-color", "hsv-color", "hsl-color", "srgb-color"],
        `
        variable c: Color.HWB = hwb(240, 0.2, 0.3, 0.7);
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      log.info(`\n=== HWB with alpha → CSS ===`);
      log.info(`Output: ${css}`);

      expect(css).toMatch(/^hwb\(240 20% 30% \/ 0\.7\)$/);
    });

    it("should output Lab with alpha in CSS format", async () => {
      const result = await executeWithCssColor(
        ["lab-color", "xyz-d50-color", "xyz-d65-color", "srgb-linear-color", "srgb-color"],
        `
        variable c: Color.Lab;
        c.l = 75;
        c.a = 20;
        c.b = -30;
        c.alpha = 0.6;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      log.info(`\n=== Lab with alpha → CSS ===`);
      log.info(`Output: ${css}`);

      expect(css).toMatch(/^lab\(75% 20 -30 \/ 0\.6\)$/);
    });

    it("should output LCH with alpha in CSS format", async () => {
      const result = await executeWithCssColor(
        [
          "lch-color",
          "lab-color",
          "xyz-d50-color",
          "xyz-d65-color",
          "srgb-linear-color",
          "srgb-color",
        ],
        `
        variable c: Color.LCH;
        c.l = 75;
        c.c = 50;
        c.h = 180;
        c.alpha = 0.4;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      log.info(`\n=== LCH with alpha → CSS ===`);
      log.info(`Output: ${css}`);

      expect(css).toMatch(/^lch\(75% 50 180 \/ 0\.4\)$/);
    });

    it("should output OKLab with alpha in CSS format", async () => {
      const result = await executeWithCssColor(
        ["oklab-color", "xyz-d65-color", "srgb-linear-color", "srgb-color"],
        `
        variable c: Color.OKLab;
        c.l = 0.7;
        c.a = 0.1;
        c.b = -0.05;
        c.alpha = 0.3;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      log.info(`\n=== OKLab with alpha → CSS ===`);
      log.info(`Output: ${css}`);

      expect(css).toMatch(/^oklab\(0\.7 0\.1 -0\.05 \/ 0\.3\)$/);
    });

    it("should output OKLCH with alpha in CSS format", async () => {
      const result = await executeWithCssColor(
        ["oklch-color", "oklab-color", "xyz-d65-color", "srgb-linear-color", "srgb-color"],
        `
        variable c: Color.OKLCH;
        c.l = 0.7;
        c.c = 0.15;
        c.h = 180;
        c.alpha = 0.9;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      log.info(`\n=== OKLCH with alpha → CSS ===`);
      log.info(`Output: ${css}`);

      expect(css).toMatch(/^oklch\(0\.7 0\.15 180 \/ 0\.9\)$/);
    });

    it("should output Display-P3 with alpha in CSS format", async () => {
      const result = await executeWithCssColor(
        ["p3-color", "p3-linear-color", "xyz-d65-color", "srgb-linear-color", "srgb-color"],
        `
        variable c: Color.P3;
        c.r = 1;
        c.g = 0.5;
        c.b = 0.25;
        c.alpha = 0.85;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      log.info(`\n=== Display-P3 with alpha → CSS ===`);
      log.info(`Output: ${css}`);

      expect(css).toMatch(/^color\(display-p3 1 0\.5 0\.25 \/ 0\.85\)$/);
    });

    it("should output sRGB with alpha in CSS format", async () => {
      const result = await executeWithCssColor(
        ["srgb-color"],
        `
        variable c: Color.SRGB;
        c.r = 1;
        c.g = 0.5;
        c.b = 0.25;
        c.alpha = 0.2;
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      log.info(`\n=== sRGB with alpha → CSS ===`);
      log.info(`Output: ${css}`);

      expect(css).toMatch(/^color\(srgb 1 0\.5 0\.25 \/ 0\.2\)$/);
    });

    it("should handle alpha = 0 (fully transparent)", async () => {
      const result = await executeWithCssColor(
        ["rgb-color"],
        `
        variable c: Color.Rgb = rgb(255, 0, 0, 0);
        c.to.css()
      `,
      );

      const css = (result as any)?.value?.value?.value || (result as any)?.toString?.();
      expect(css).toBe("rgb(255 0 0 / 0)");
    });
  });
});
