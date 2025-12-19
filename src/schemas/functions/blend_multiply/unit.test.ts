import { describe, expect, it } from "vitest";
import {
  executeWithSchema,
} from "@tests/helpers/schema-test-utils";

describe("Blend Multiply Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const { getBundledSchema } = await import("@tests/helpers/schema-test-utils");
      const schema = await getBundledSchema("blend_multiply", "function");

      expect(schema.name).toBe("Blend Multiply");
      expect(schema.type).toBe("function");
      expect((schema as any).keyword).toBe("blend_multiply");
    });
  });

  describe("Identity Properties", () => {
    it("multiplying with white should leave color unchanged", async () => {
      const result = await executeWithSchema(
        "blend_multiply",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.5; base.g = 0.3; base.b = 0.7;
        variable blend: Color.SRGB;
        blend.r = 1; blend.g = 1; blend.b = 1;
        blend_multiply(base, blend)
        `,
      );

      expect(result.value.r.value).toBeCloseTo(0.5, 5);
      expect(result.value.g.value).toBeCloseTo(0.3, 5);
      expect(result.value.b.value).toBeCloseTo(0.7, 5);
    });

    it("multiplying with black should produce black", async () => {
      const result = await executeWithSchema(
        "blend_multiply",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.8; base.g = 0.6; base.b = 0.4;
        variable blend: Color.SRGB;
        blend.r = 0; blend.g = 0; blend.b = 0;
        blend_multiply(base, blend)
        `,
      );

      expect(result.value.r.value).toBeCloseTo(0, 5);
      expect(result.value.g.value).toBeCloseTo(0, 5);
      expect(result.value.b.value).toBeCloseTo(0, 5);
    });
  });

  describe("Multiplication Formula", () => {
    it("should multiply channels correctly", async () => {
      const result = await executeWithSchema(
        "blend_multiply",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.8; base.g = 0.6; base.b = 0.4;
        variable blend: Color.SRGB;
        blend.r = 0.5; blend.g = 0.5; blend.b = 0.5;
        blend_multiply(base, blend)
        `,
      );

      expect(result.value.r.value).toBeCloseTo(0.4, 5);
      expect(result.value.g.value).toBeCloseTo(0.3, 5);
      expect(result.value.b.value).toBeCloseTo(0.2, 5);
    });
  });

  describe("Darkening Property", () => {
    it("result should always be darker or equal", async () => {
      const result = await executeWithSchema(
        "blend_multiply",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.7; base.g = 0.8; base.b = 0.9;
        variable blend: Color.SRGB;
        blend.r = 0.6; blend.g = 0.7; blend.b = 0.8;
        blend_multiply(base, blend)
        `,
      );

      // Result should be ≤ both inputs
      expect(result.value.r.value).toBeLessThanOrEqual(0.7);
      expect(result.value.r.value).toBeLessThanOrEqual(0.6);
      expect(result.value.g.value).toBeLessThanOrEqual(0.8);
      expect(result.value.g.value).toBeLessThanOrEqual(0.7);
    });
  });

  describe("Commutativity", () => {
    it("should be commutative (order should not matter)", async () => {
      const result1 = await executeWithSchema(
        "blend_multiply",
        "function",
        `
        variable a: Color.SRGB;
        a.r = 0.3; a.g = 0.5; a.b = 0.7;
        variable b: Color.SRGB;
        b.r = 0.6; b.g = 0.4; b.b = 0.2;
        blend_multiply(a, b)
        `,
      );

      const result2 = await executeWithSchema(
        "blend_multiply",
        "function",
        `
        variable a: Color.SRGB;
        a.r = 0.6; a.g = 0.4; a.b = 0.2;
        variable b: Color.SRGB;
        b.r = 0.3; b.g = 0.5; b.b = 0.7;
        blend_multiply(a, b)
        `,
      );

      expect(result1.value.r.value).toBeCloseTo(result2.value.r.value, 5);
      expect(result1.value.g.value).toBeCloseTo(result2.value.g.value, 5);
      expect(result1.value.b.value).toBeCloseTo(result2.value.b.value, 5);
    });
  });
});

