import { describe, expect, it } from "vitest";
import {
  executeWithSchema,
} from "@tests/helpers/schema-test-utils";

describe("Hue Difference Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const { getBundledSchema } = await import("@tests/helpers/schema-test-utils");
      const schema = await getBundledSchema("hue_difference", "function");

      expect(schema.name).toBe("Hue Difference");
      expect(schema.type).toBe("function");
      expect((schema as any).keyword).toBe("hue_difference");
    });
  });

  describe("Same Hue", () => {
    it("should return 0 for identical colors", async () => {
      const result = await executeWithSchema(
        "hue_difference",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 0; c2.b = 0;
        hue_difference(c1, c2)
        `,
      );

      expect(result.value).toBeCloseTo(0, 1);
    });
  });

  describe("Complementary Colors", () => {
    it("should return ~180 for complement colors", async () => {
      // Red vs Cyan are complementary
      const result = await executeWithSchema(
        "hue_difference",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 0; c2.g = 1; c2.b = 1;
        hue_difference(c1, c2)
        `,
      );

      // Should be close to 180 (complementary)
      expect(result.value).toBeGreaterThan(150);
    });
  });

  describe("Shortest Path", () => {
    it("should take shortest path around hue circle", async () => {
      // Test with colors near the 0/360 boundary
      // Magenta (high hue ~330) vs Red (low hue ~30)
      // Should be ~60, not ~300
      const result = await executeWithSchema(
        "hue_difference",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 0; c2.b = 0.5;
        hue_difference(c1, c2)
        `,
      );

      // Should take short path
      expect(result.value).toBeLessThan(180);
    });
  });

  describe("Adjacent Colors", () => {
    it("should return small value for adjacent hues", async () => {
      // Red and Orange are adjacent
      const result = await executeWithSchema(
        "hue_difference",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 0.5; c2.b = 0;
        hue_difference(c1, c2)
        `,
      );

      // Adjacent colors should have small difference
      expect(result.value).toBeLessThan(60);
    });
  });

  describe("Symmetry", () => {
    it("should be symmetric", async () => {
      const result1 = await executeWithSchema(
        "hue_difference",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 1; c1.g = 0; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 0; c2.g = 1; c2.b = 0;
        hue_difference(c1, c2)
        `,
      );

      const result2 = await executeWithSchema(
        "hue_difference",
        "function",
        `
        variable c1: Color.SRGB;
        c1.r = 0; c1.g = 1; c1.b = 0;
        variable c2: Color.SRGB;
        c2.r = 1; c2.g = 0; c2.b = 0;
        hue_difference(c1, c2)
        `,
      );

      expect(result1.value).toBeCloseTo(result2.value, 3);
    });
  });
});

