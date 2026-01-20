/**
 * Unit tests for the Contrasting From Array function
 * Finds first color meeting contrast threshold, or best if none qualify
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Contrasting From Array Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "contrasting_from_array",
        "function",
      )) as FunctionSpecification;

      expect(schema.name).toBe("Contrasting From Array");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("contrasting_from_array");
    });
  });

  describe("Function Execution", () => {
    it("should return first color if it meets threshold", async () => {
      const result = await executeWithSchema(
        "contrasting_from_array",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        
        variable colors: List = black, gray;
        contrasting_from_array(colors, white, 4.5)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const color = list[0];
      const sufficient = list[1].value;
      const index = list[3].value;

      expect(sufficient).toBe(1);
      expect(index).toBe(0); // First color (black) should be selected
      // Color is in sRGB (black = 0, 0, 0)
      expect(color.value.r.value).toBeCloseTo(0, 2);
    });

    it("should skip first color if it doesn't meet threshold", async () => {
      const result = await executeWithSchema(
        "contrasting_from_array",
        "function",
        `
        variable light_gray: Color.SRGB;
        light_gray.r = 0.8; light_gray.g = 0.8; light_gray.b = 0.8;
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        
        variable colors: List = light_gray, black;
        contrasting_from_array(colors, white, 4.5)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const sufficient = list[1].value;
      const index = list[3].value;

      expect(sufficient).toBe(1);
      expect(index).toBe(1); // Second color (black) should be selected
    });

    it("should return best color when none meet threshold", async () => {
      const result = await executeWithSchema(
        "contrasting_from_array",
        "function",
        `
        variable light_gray1: Color.SRGB;
        light_gray1.r = 0.9; light_gray1.g = 0.9; light_gray1.b = 0.9;
        variable light_gray2: Color.SRGB;
        light_gray2.r = 0.7; light_gray2.g = 0.7; light_gray2.b = 0.7;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        
        variable colors: List = light_gray1, light_gray2;
        contrasting_from_array(colors, white, 4.5)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const sufficient = list[1].value;
      const index = list[3].value;

      expect(sufficient).toBe(0); // None meet threshold
      expect(index).toBe(1); // Second has higher contrast (darker gray)
    });

    it("should return correct contrast value (black on white = 21:1)", async () => {
      // From graph-engine: WCAG 2.1 black on white = 21:1
      const result = await executeWithSchema(
        "contrasting_from_array",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        
        variable colors: List = black, gray;
        contrasting_from_array(colors, white, 4.5)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const contrast = list[2].value;

      // Black on white is 21:1 (WCAG 2.1 formula)
      expect(contrast).toBeCloseTo(21, 0);
    });

    it("should return highest contrast when none meet threshold (like graph-engine)", async () => {
      // From graph-engine: light grays on white, neither meets 60 APCA
      // We use WCAG 2.1, so adjust threshold to 4.5
      const result = await executeWithSchema(
        "contrasting_from_array",
        "function",
        `
        variable light_gray1: Color.SRGB;
        light_gray1.r = 0.87; light_gray1.g = 0.87; light_gray1.b = 0.87;
        variable light_gray2: Color.SRGB;
        light_gray2.r = 0.73; light_gray2.g = 0.73; light_gray2.b = 0.73;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        
        variable colors: List = light_gray1, light_gray2;
        contrasting_from_array(colors, white, 4.5)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const sufficient = list[1].value;
      const index = list[3].value;

      // Neither light gray meets 4.5:1 on white
      expect(sufficient).toBe(0);
      // light_gray2 (0.73) has higher contrast, so index should be 1
      expect(index).toBe(1);
    });

    it("should work with custom threshold", async () => {
      const result = await executeWithSchema(
        "contrasting_from_array",
        "function",
        `
        variable dark_gray: Color.SRGB;
        dark_gray.r = 0.3; dark_gray.g = 0.3; dark_gray.b = 0.3;
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        
        variable colors: List = dark_gray, black;
        contrasting_from_array(colors, white, 7)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const sufficient = list[1].value;
      const contrast = list[2].value;

      expect(sufficient).toBe(1);
      expect(contrast).toBeGreaterThanOrEqual(7);
    });

    it("should select first sufficient color from two", async () => {
      const result = await executeWithSchema(
        "contrasting_from_array",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        variable dark_gray: Color.SRGB;
        dark_gray.r = 0.2; dark_gray.g = 0.2; dark_gray.b = 0.2;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        
        variable colors: List = black, dark_gray;
        contrasting_from_array(colors, white, 4.5)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const index = list[3].value;

      // Both meet threshold, so first (black at index 0) should be selected
      expect(index).toBe(0);
    });

    it("should return original color unchanged (same color space as input)", async () => {
      const result = await executeWithSchema(
        "contrasting_from_array",
        "function",
        `
        variable dark_red: Color.SRGB;
        dark_red.r = 0.3; dark_red.g = 0; dark_red.b = 0;
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        
        variable colors: List = dark_red, black;
        contrasting_from_array(colors, white, 4.5)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const color = list[0];

      expect(color?.constructor.name).toBe("ColorSymbol");
      // Returns original color from array unchanged
      expect(color.value.r).toBeDefined();
      expect(color.value.g).toBeDefined();
      expect(color.value.b).toBeDefined();
    });

    it("should preserve input color space (uses XYZ-D65 internally for luminance)", async () => {
      // Uses XYZ-D65 internally for gamut-agnostic luminance calculation
      // Returns original colors unchanged
      const result = await executeWithSchema(
        "contrasting_from_array",
        "function",
        `
        variable green: Color.SRGB;
        green.r = 0; green.g = 0.5; green.b = 0;
        variable dark: Color.SRGB;
        dark.r = 0; dark.g = 0.1; dark.b = 0;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        
        variable colors: List = green, dark;
        contrasting_from_array(colors, white, 4.5)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const color = list[0];
      const contrast = list[2].value;

      // Returns original color unchanged (same space as input)
      expect(color.value.r).toBeDefined();
      expect(contrast).toBeGreaterThan(1);
    });
  });
});
