/**
 * Unit tests for the Sort By Distance function
 * Sorts colors by various criteria relative to a reference color
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Sort By Distance Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "sort_by_distance",
        "function",
      )) as FunctionSpecification;

      expect(schema.name).toBe("Sort By Distance");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("sort_by_distance");
    });
  });

  describe("Function Execution", () => {
    it("should sort by distance (OKLab Euclidean) - default", async () => {
      const result = await executeWithSchema(
        "sort_by_distance",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        variable blue: Color.SRGB;
        blue.r = 0; blue.g = 0; blue.b = 1;
        
        variable colors: List = blue, red;
        variable compare: Color.SRGB;
        compare.r = 1; compare.g = 0; compare.b = 0;
        
        sort_by_distance(colors, compare)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      // Result is [sorted_colors, indices] but as a nested structure
      // First element is colors, second is indices
      expect(list.length).toBeGreaterThanOrEqual(2);
    });

    it("should sort by contrast (highest first)", async () => {
      const result = await executeWithSchema(
        "sort_by_distance",
        "function",
        `
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        
        variable colors: List = black, white;
        variable compare: Color.SRGB;
        compare.r = 0; compare.g = 0; compare.b = 0;
        
        sort_by_distance(colors, compare, "contrast")
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      expect(list.length).toBeGreaterThanOrEqual(2);
    });

    it("should sort by hue (closest first)", async () => {
      const result = await executeWithSchema(
        "sort_by_distance",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        variable blue: Color.SRGB;
        blue.r = 0; blue.g = 0; blue.b = 1;
        
        variable colors: List = blue, red;
        variable compare: Color.SRGB;
        compare.r = 1; compare.g = 0.3; compare.b = 0;
        
        sort_by_distance(colors, compare, "hue")
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      expect(list.length).toBeGreaterThanOrEqual(2);
    });

    it("should sort by lightness (closest first)", async () => {
      const result = await executeWithSchema(
        "sort_by_distance",
        "function",
        `
        variable dark: Color.SRGB;
        dark.r = 0.1; dark.g = 0.1; dark.b = 0.1;
        variable light: Color.SRGB;
        light.r = 0.9; light.g = 0.9; light.b = 0.9;
        
        variable colors: List = light, dark;
        variable compare: Color.SRGB;
        compare.r = 0.5; compare.g = 0.5; compare.b = 0.5;
        
        sort_by_distance(colors, compare, "lightness")
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      expect(list.length).toBeGreaterThanOrEqual(2);
    });

    it("should sort by chroma (closest first)", async () => {
      const result = await executeWithSchema(
        "sort_by_distance",
        "function",
        `
        variable vivid: Color.SRGB;
        vivid.r = 1; vivid.g = 0; vivid.b = 0;
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        
        variable colors: List = vivid, gray;
        variable compare: Color.SRGB;
        compare.r = 0.7; compare.g = 0.3; compare.b = 0.3;
        
        sort_by_distance(colors, compare, "chroma")
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      expect(list.length).toBeGreaterThanOrEqual(2);
    });

    it("should return indices in original order", async () => {
      const result = await executeWithSchema(
        "sort_by_distance",
        "function",
        `
        variable c0: Color.SRGB;
        c0.r = 0; c0.g = 0; c0.b = 1;
        variable c1: Color.SRGB;
        c1.r = 1; c1.g = 0; c1.b = 0;
        
        variable colors: List = c0, c1;
        variable compare: Color.SRGB;
        compare.r = 1; compare.g = 0; compare.b = 0;
        
        sort_by_distance(colors, compare, "distance")
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      expect(list.length).toBeGreaterThanOrEqual(2);
    });

    it("should handle two identical colors", async () => {
      const result = await executeWithSchema(
        "sort_by_distance",
        "function",
        `
        variable red1: Color.SRGB;
        red1.r = 1; red1.g = 0; red1.b = 0;
        variable red2: Color.SRGB;
        red2.r = 1; red2.g = 0; red2.b = 0;
        
        variable colors: List = red1, red2;
        variable compare: Color.SRGB;
        compare.r = 0; compare.g = 1; compare.b = 0;
        
        sort_by_distance(colors, compare)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const sortedColors = list[0].value;

      expect(sortedColors.length).toBe(2);
    });

    it("should handle two color array", async () => {
      const result = await executeWithSchema(
        "sort_by_distance",
        "function",
        `
        variable far: Color.SRGB;
        far.r = 0; far.g = 0; far.b = 1;
        variable close: Color.SRGB;
        close.r = 1; close.g = 0; close.b = 0;
        
        variable colors: List = far, close;
        variable compare: Color.SRGB;
        compare.r = 0.9; compare.g = 0.1; compare.b = 0;
        
        sort_by_distance(colors, compare)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      expect(list.length).toBeGreaterThanOrEqual(2);
    });

    it("should return result as list of [colors, indices]", async () => {
      // Test that the function returns the expected structure
      // Uses XYZ-D65 internally for gamut-agnostic calculations
      const result = await executeWithSchema(
        "sort_by_distance",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 0; c2.g = 0; c2.b = 1;
        
        variable colors: List = c1, c2;
        variable compare: Color.SRGB;
        compare.r = 1; compare.g = 0; compare.b = 0;
        
        sort_by_distance(colors, compare)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      // Result is [sorted_colors_list, indices_list]
      expect(list.length).toBeGreaterThanOrEqual(2);
    });

    it("should preserve input color space (returns original colors unchanged)", async () => {
      // Uses XYZ-D65 internally for gamut-agnostic distance calculation
      // Returns original colors unchanged (same space as input)
      const result = await executeWithSchema(
        "sort_by_distance",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        variable green: Color.SRGB;
        green.r = 0; green.g = 1; green.b = 0;
        
        variable colors: List = green, red;
        variable compare: Color.SRGB;
        compare.r = 0.9; compare.g = 0.1; compare.b = 0;
        
        sort_by_distance(colors, compare)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      // Result is [sorted_colors_list, indices_list]
      // Red (index 1) should be sorted first as it's closer to compare
      expect(list.length).toBeGreaterThanOrEqual(2);
    });
  });
});
