/**
 * Unit tests for the Contrasting Alpha function
 * Finds minimum alpha needed to achieve target contrast
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Contrasting Alpha Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "contrasting_alpha",
        "function",
      )) as FunctionSpecification;

      expect(schema.name).toBe("Contrasting Alpha");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("contrasting_alpha");
    });
  });

  describe("Function Execution", () => {
    it("should return alpha=1 when contrast is insufficient at full opacity", async () => {
      // Light gray on white - even full opacity won't meet 4.5
      const result = await executeWithSchema(
        "contrasting_alpha",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 0.8; fg.g = 0.8; fg.b = 0.8;
        variable bg: Color.SRGB;
        bg.r = 1; bg.g = 1; bg.b = 1;
        contrasting_alpha(fg, bg, 4.5)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const alpha = list[0].value;

      // Should return 1 since even full opacity doesn't meet threshold
      expect(alpha).toBe(1);
    });

    it("should find low alpha for high-contrast pair (black on white)", async () => {
      const result = await executeWithSchema(
        "contrasting_alpha",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 0; fg.g = 0; fg.b = 0;
        variable bg: Color.SRGB;
        bg.r = 1; bg.g = 1; bg.b = 1;
        contrasting_alpha(fg, bg, 4.5)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const alpha = list[0].value;
      const contrast = list[1].value;

      // Black on white has 21:1 contrast at full opacity
      // Alpha found should be less than 1 and meet threshold
      expect(alpha).toBeLessThan(1);
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it("should find appropriate alpha for medium contrast pair", async () => {
      const result = await executeWithSchema(
        "contrasting_alpha",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 0.2; fg.g = 0.2; fg.b = 0.2;
        variable bg: Color.SRGB;
        bg.r = 0.9; bg.g = 0.9; bg.b = 0.9;
        contrasting_alpha(fg, bg, 4.5)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const alpha = list[0].value;
      const contrast = list[1].value;

      // Alpha should be found that meets the threshold
      expect(alpha).toBeGreaterThan(0);
      expect(alpha).toBeLessThanOrEqual(1);
      expect(contrast).toBeGreaterThanOrEqual(4.4); // Allow small margin
    });

    it("should return the original foreground color unchanged", async () => {
      const result = await executeWithSchema(
        "contrasting_alpha",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 0; fg.g = 0; fg.b = 0;
        variable bg: Color.SRGB;
        bg.r = 1; bg.g = 1; bg.b = 1;
        contrasting_alpha(fg, bg, 4.5)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const color = list[2];

      expect(color?.constructor.name).toBe("ColorSymbol");
      // Returns original foreground color unchanged (user applies alpha themselves)
      expect(color.value.r.value).toBe(0);
      expect(color.value.g.value).toBe(0);
      expect(color.value.b.value).toBe(0);
    });

    it("should preserve input color space (return original foreground)", async () => {
      // Uses XYZ-D65 internally for gamut-agnostic luminance calculation
      // Returns original foreground color unchanged
      const result = await executeWithSchema(
        "contrasting_alpha",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 0; fg.g = 0.5; fg.b = 0;
        variable bg: Color.SRGB;
        bg.r = 1; bg.g = 1; bg.b = 1;
        contrasting_alpha(fg, bg, 4.5)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const alpha = list[0].value;
      const contrast = list[1].value;
      const color = list[2];

      // Returns original foreground unchanged (same color space as input)
      expect(color.value.r.value).toBe(0);
      expect(color.value.g.value).toBe(0.5);
      expect(color.value.b.value).toBe(0);
      expect(alpha).toBeGreaterThan(0);
      expect(alpha).toBeLessThanOrEqual(1);
      expect(contrast).toBeGreaterThanOrEqual(4.4);
    });

    it("should work with custom threshold", async () => {
      const result = await executeWithSchema(
        "contrasting_alpha",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 0; fg.g = 0; fg.b = 0;
        variable bg: Color.SRGB;
        bg.r = 1; bg.g = 1; bg.b = 1;
        contrasting_alpha(fg, bg, 7)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const contrast = list[1].value;

      // Should meet the higher AAA threshold
      expect(contrast).toBeGreaterThanOrEqual(7);
    });

    it("should work with colored foreground", async () => {
      const result = await executeWithSchema(
        "contrasting_alpha",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 0; fg.g = 0; fg.b = 0.5;
        variable bg: Color.SRGB;
        bg.r = 1; bg.g = 1; bg.b = 1;
        contrasting_alpha(fg, bg, 4.5)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const alpha = list[0].value;
      const contrast = list[1].value;

      expect(alpha).toBeGreaterThan(0);
      expect(alpha).toBeLessThanOrEqual(1);
      expect(contrast).toBeGreaterThanOrEqual(4.4);
    });
  });
});
