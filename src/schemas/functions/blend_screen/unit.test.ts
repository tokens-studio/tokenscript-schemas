import { describe, expect, it } from "vitest";
import {
  executeWithSchema,
} from "@tests/helpers/schema-test-utils";

describe("Blend Screen Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const { getBundledSchema } = await import("@tests/helpers/schema-test-utils");
      const schema = await getBundledSchema("blend_screen", "function");

      expect(schema.name).toBe("Blend Screen");
      expect(schema.type).toBe("function");
      expect((schema as any).keyword).toBe("blend_screen");
    });
  });

  describe("Identity Properties", () => {
    it("screening with black should leave color unchanged", async () => {
      const result = await executeWithSchema(
        "blend_screen",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.5; base.g = 0.3; base.b = 0.7;
        variable blend: Color.SRGB;
        blend.r = 0; blend.g = 0; blend.b = 0;
        blend_screen(base, blend)
        `,
      );

      expect(result.value.r.value).toBeCloseTo(0.5, 5);
      expect(result.value.g.value).toBeCloseTo(0.3, 5);
      expect(result.value.b.value).toBeCloseTo(0.7, 5);
    });

    it("screening with white should produce white", async () => {
      const result = await executeWithSchema(
        "blend_screen",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.2; base.g = 0.4; base.b = 0.6;
        variable blend: Color.SRGB;
        blend.r = 1; blend.g = 1; blend.b = 1;
        blend_screen(base, blend)
        `,
      );

      expect(result.value.r.value).toBeCloseTo(1, 5);
      expect(result.value.g.value).toBeCloseTo(1, 5);
      expect(result.value.b.value).toBeCloseTo(1, 5);
    });
  });

  describe("Screen Formula", () => {
    it("should apply screen formula correctly", async () => {
      const result = await executeWithSchema(
        "blend_screen",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.4; base.g = 0.5; base.b = 0.6;
        variable blend: Color.SRGB;
        blend.r = 0.3; blend.g = 0.4; blend.b = 0.5;
        blend_screen(base, blend)
        `,
      );

      // Expected: 1 - (1-A)(1-B) = A + B - AB
      expect(result.value.r.value).toBeCloseTo(0.4 + 0.3 - 0.4 * 0.3, 5);
      expect(result.value.g.value).toBeCloseTo(0.5 + 0.4 - 0.5 * 0.4, 5);
      expect(result.value.b.value).toBeCloseTo(0.6 + 0.5 - 0.6 * 0.5, 5);
    });
  });

  describe("Lightening Property", () => {
    it("result should always be lighter or equal", async () => {
      const result = await executeWithSchema(
        "blend_screen",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.3; base.g = 0.4; base.b = 0.5;
        variable blend: Color.SRGB;
        blend.r = 0.2; blend.g = 0.3; blend.b = 0.4;
        blend_screen(base, blend)
        `,
      );

      // Result should be ≥ both inputs
      expect(result.value.r.value).toBeGreaterThanOrEqual(0.3);
      expect(result.value.r.value).toBeGreaterThanOrEqual(0.2);
      expect(result.value.g.value).toBeGreaterThanOrEqual(0.4);
      expect(result.value.g.value).toBeGreaterThanOrEqual(0.3);
    });
  });

  describe("Commutativity", () => {
    it("should be commutative", async () => {
      const result1 = await executeWithSchema(
        "blend_screen",
        "function",
        `
        variable a: Color.SRGB;
        a.r = 0.3; a.g = 0.5; a.b = 0.7;
        variable b: Color.SRGB;
        b.r = 0.6; b.g = 0.4; b.b = 0.2;
        blend_screen(a, b)
        `,
      );

      const result2 = await executeWithSchema(
        "blend_screen",
        "function",
        `
        variable a: Color.SRGB;
        a.r = 0.6; a.g = 0.4; a.b = 0.2;
        variable b: Color.SRGB;
        b.r = 0.3; b.g = 0.5; b.b = 0.7;
        blend_screen(a, b)
        `,
      );

      expect(result1.value.r.value).toBeCloseTo(result2.value.r.value, 5);
      expect(result1.value.g.value).toBeCloseTo(result2.value.g.value, 5);
      expect(result1.value.b.value).toBeCloseTo(result2.value.b.value, 5);
    });
  });
});

