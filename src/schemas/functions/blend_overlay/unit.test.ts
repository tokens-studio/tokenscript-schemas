import { describe, expect, it } from "vitest";
import {
  executeWithSchema,
} from "@tests/helpers/schema-test-utils";

describe("Blend Overlay Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const { getBundledSchema } = await import("@tests/helpers/schema-test-utils");
      const schema = await getBundledSchema("blend_overlay", "function");

      expect(schema.name).toBe("Blend Overlay");
      expect(schema.type).toBe("function");
      expect((schema as any).keyword).toBe("blend_overlay");
    });
  });

  describe("Neutral Gray", () => {
    it("50% gray blend should leave color unchanged", async () => {
      const result = await executeWithSchema(
        "blend_overlay",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.4; base.g = 0.6; base.b = 0.8;
        variable blend: Color.SRGB;
        blend.r = 0.5; blend.g = 0.5; blend.b = 0.5;
        blend_overlay(base, blend)
        `,
      );

      expect(result.value.r.value).toBeCloseTo(0.4, 2);
      expect(result.value.g.value).toBeCloseTo(0.6, 2);
      expect(result.value.b.value).toBeCloseTo(0.8, 2);
    });
  });

  describe("Dark Base (Multiply Behavior)", () => {
    it("should multiply when base < 0.5", async () => {
      const result = await executeWithSchema(
        "blend_overlay",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.3; base.g = 0.2; base.b = 0.4;
        variable blend: Color.SRGB;
        blend.r = 0.6; blend.g = 0.7; blend.b = 0.8;
        blend_overlay(base, blend)
        `,
      );

      // For base < 0.5: 2 × base × blend
      expect(result.value.r.value).toBeCloseTo(2 * 0.3 * 0.6, 5);
      expect(result.value.g.value).toBeCloseTo(2 * 0.2 * 0.7, 5);
      expect(result.value.b.value).toBeCloseTo(2 * 0.4 * 0.8, 5);
    });
  });

  describe("Light Base (Screen Behavior)", () => {
    it("should screen when base >= 0.5", async () => {
      const result = await executeWithSchema(
        "blend_overlay",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.7; base.g = 0.8; base.b = 0.6;
        variable blend: Color.SRGB;
        blend.r = 0.3; blend.g = 0.4; blend.b = 0.5;
        blend_overlay(base, blend)
        `,
      );

      // For base >= 0.5: 1 - 2 × (1-base) × (1-blend)
      expect(result.value.r.value).toBeCloseTo(1 - 2 * (1 - 0.7) * (1 - 0.3), 5);
      expect(result.value.g.value).toBeCloseTo(1 - 2 * (1 - 0.8) * (1 - 0.4), 5);
      expect(result.value.b.value).toBeCloseTo(1 - 2 * (1 - 0.6) * (1 - 0.5), 5);
    });
  });

  describe("Extreme Values", () => {
    it("black base with any blend should produce darker result", async () => {
      const result = await executeWithSchema(
        "blend_overlay",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0; base.g = 0; base.b = 0;
        variable blend: Color.SRGB;
        blend.r = 0.8; blend.g = 0.6; blend.b = 0.4;
        blend_overlay(base, blend)
        `,
      );

      // base=0 < 0.5, so 2×0×blend = 0
      expect(result.value.r.value).toBeCloseTo(0, 5);
      expect(result.value.g.value).toBeCloseTo(0, 5);
      expect(result.value.b.value).toBeCloseTo(0, 5);
    });

    it("white base with any blend should produce lighter result", async () => {
      const result = await executeWithSchema(
        "blend_overlay",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 1; base.g = 1; base.b = 1;
        variable blend: Color.SRGB;
        blend.r = 0.2; blend.g = 0.4; blend.b = 0.6;
        blend_overlay(base, blend)
        `,
      );

      // base=1 >= 0.5, so 1 - 2×(1-1)×(1-blend) = 1
      expect(result.value.r.value).toBeCloseTo(1, 5);
      expect(result.value.g.value).toBeCloseTo(1, 5);
      expect(result.value.b.value).toBeCloseTo(1, 5);
    });
  });
});

