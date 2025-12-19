import { describe, expect, it } from "vitest";
import {
  executeWithSchema,
} from "@tests/helpers/schema-test-utils";

describe("Alpha Blend Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const { getBundledSchema } = await import("@tests/helpers/schema-test-utils");
      const schema = await getBundledSchema("alpha_blend", "function");

      expect(schema.name).toBe("Alpha Blend");
      expect(schema.type).toBe("function");
      expect((schema as any).keyword).toBe("alpha_blend");
    });
  });

  describe("Extreme Alpha Values", () => {
    it("alpha=0 should return background color", async () => {
      const result = await executeWithSchema(
        "alpha_blend",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 1; fg.g = 0; fg.b = 0;
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 0; bg.b = 1;
        alpha_blend(fg, bg, 0)
        `,
      );

      expect(result.value.r.value).toBeCloseTo(0, 5);
      expect(result.value.g.value).toBeCloseTo(0, 5);
      expect(result.value.b.value).toBeCloseTo(1, 5);
    });

    it("alpha=1 should return foreground color", async () => {
      const result = await executeWithSchema(
        "alpha_blend",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 1; fg.g = 0; fg.b = 0;
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 0; bg.b = 1;
        alpha_blend(fg, bg, 1)
        `,
      );

      expect(result.value.r.value).toBeCloseTo(1, 5);
      expect(result.value.g.value).toBeCloseTo(0, 5);
      expect(result.value.b.value).toBeCloseTo(0, 5);
    });
  });

  describe("Default Alpha", () => {
    it("should use 0.5 alpha by default", async () => {
      const result = await executeWithSchema(
        "alpha_blend",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 1; fg.g = 1; fg.b = 1;
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 0; bg.b = 0;
        alpha_blend(fg, bg)
        `,
      );

      // 50% white over black = 50% gray
      expect(result.value.r.value).toBeCloseTo(0.5, 5);
      expect(result.value.g.value).toBeCloseTo(0.5, 5);
      expect(result.value.b.value).toBeCloseTo(0.5, 5);
    });
  });

  describe("Blending Formula", () => {
    it("should blend correctly at 25% alpha", async () => {
      const result = await executeWithSchema(
        "alpha_blend",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 1; fg.g = 0; fg.b = 0;
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 1; bg.b = 0;
        alpha_blend(fg, bg, 0.25)
        `,
      );

      // R: 1*0.25 + 0*0.75 = 0.25
      // G: 0*0.25 + 1*0.75 = 0.75
      // B: 0*0.25 + 0*0.75 = 0
      expect(result.value.r.value).toBeCloseTo(0.25, 5);
      expect(result.value.g.value).toBeCloseTo(0.75, 5);
      expect(result.value.b.value).toBeCloseTo(0, 5);
    });
  });

  describe("Alpha Clamping", () => {
    it("should clamp negative alpha to 0", async () => {
      const result = await executeWithSchema(
        "alpha_blend",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 1; fg.g = 0; fg.b = 0;
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 1; bg.b = 0;
        alpha_blend(fg, bg, -0.5)
        `,
      );

      // Should be same as alpha=0 (all background)
      expect(result.value.r.value).toBeCloseTo(0, 5);
      expect(result.value.g.value).toBeCloseTo(1, 5);
    });

    it("should clamp alpha > 1 to 1", async () => {
      const result = await executeWithSchema(
        "alpha_blend",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 1; fg.g = 0; fg.b = 0;
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 1; bg.b = 0;
        alpha_blend(fg, bg, 1.5)
        `,
      );

      // Should be same as alpha=1 (all foreground)
      expect(result.value.r.value).toBeCloseTo(1, 5);
      expect(result.value.g.value).toBeCloseTo(0, 5);
    });
  });
});

