import { describe, expect, it } from "vitest";
import {
  executeWithSchema,
} from "@tests/helpers/schema-test-utils";

describe("Meets Contrast Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const { getBundledSchema } = await import("@tests/helpers/schema-test-utils");
      const schema = await getBundledSchema("meets_contrast", "function");

      expect(schema.name).toBe("Meets Contrast");
      expect(schema.type).toBe("function");
      expect((schema as any).keyword).toBe("meets_contrast");
    });
  });

  describe("Black and White (Maximum Contrast)", () => {
    it("should return true for black/white at AA threshold", async () => {
      const result = await executeWithSchema(
        "meets_contrast",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 1; c2.b = 1;
        meets_contrast(c1, c2, 4.5)
        `,
      );

      expect(result.value).toBe(true);
    });

    it("should return true for black/white at AAA threshold", async () => {
      const result = await executeWithSchema(
        "meets_contrast",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 1; c2.b = 1;
        meets_contrast(c1, c2, 7)
        `,
      );

      expect(result.value).toBe(true);
    });
  });

  describe("Identical Colors (No Contrast)", () => {
    it("should return false for identical colors", async () => {
      const result = await executeWithSchema(
        "meets_contrast",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.5; c1.g = 0.5; c1.b = 0.5;
        variable c2: Color.SRGB;
        c2.r = 0.5; c2.g = 0.5; c2.b = 0.5;
        meets_contrast(c1, c2, 4.5)
        `,
      );

      expect(result.value).toBe(false);
    });
  });

  describe("AA Threshold (4.5:1)", () => {
    it("should return true for good contrast (dark gray on white)", async () => {
      // Dark gray (#595959) on white should meet AA
      const result = await executeWithSchema(
        "meets_contrast",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.35; c1.g = 0.35; c1.b = 0.35;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 1; c2.b = 1;
        meets_contrast(c1, c2, 4.5)
        `,
      );

      expect(result.value).toBe(true);
    });

    it("should return false for poor contrast (light gray on white)", async () => {
      // Light gray on white fails AA
      const result = await executeWithSchema(
        "meets_contrast",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.75; c1.g = 0.75; c1.b = 0.75;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 1; c2.b = 1;
        meets_contrast(c1, c2, 4.5)
        `,
      );

      expect(result.value).toBe(false);
    });
  });

  describe("Large Text AA Threshold (3:1)", () => {
    it("should return true for moderate contrast at 3:1 threshold", async () => {
      const result = await executeWithSchema(
        "meets_contrast",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.45; c1.g = 0.45; c1.b = 0.45;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 1; c2.b = 1;
        meets_contrast(c1, c2, 3)
        `,
      );

      expect(result.value).toBe(true);
    });
  });

  describe("Default Threshold", () => {
    it("should use 4.5 as default threshold", async () => {
      // Dark gray on white should meet default AA (4.5:1)
      const result = await executeWithSchema(
        "meets_contrast",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.3; c1.g = 0.3; c1.b = 0.3;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 1; c2.b = 1;
        meets_contrast(c1, c2)
        `,
      );

      expect(result.value).toBe(true);
    });
  });

  describe("Order Independence", () => {
    it("should give same result regardless of color order", async () => {
      const result1 = await executeWithSchema(
        "meets_contrast",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.2; c1.g = 0.2; c1.b = 0.2;
        variable c2: Color.SRGB;
        c2.r = 0.9; c2.g = 0.9; c2.b = 0.9;
        meets_contrast(c1, c2, 4.5)
        `,
      );

      const result2 = await executeWithSchema(
        "meets_contrast",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0.9; c1.g = 0.9; c1.b = 0.9;
        variable c2: Color.SRGB;
        c2.r = 0.2; c2.g = 0.2; c2.b = 0.2;
        meets_contrast(c1, c2, 4.5)
        `,
      );

      expect(result1.value).toBe(result2.value);
    });
  });
});

