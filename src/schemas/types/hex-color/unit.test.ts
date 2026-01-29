import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

describe("Hex Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have valid schema structure", async () => {
      const schema = (await getBundledSchema("hex-color")) as ColorSpecification;

      expect(schema.name).toBe("Hex");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.type).toBe("object");
      expect(schema.schema?.properties.value).toBeDefined();
      expect(schema.schema?.properties.value.type).toBe("string");
    });

    it("should have hex initializer", async () => {
      const schema = (await getBundledSchema("hex-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("hex");
      expect(schema.initializers[0].script.script).toContain("Color.Hex");
    });
  });

  describe("Initialization", () => {
    it("should create hex color from string", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable c: Color.Hex = #ff0000;
        return c;
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Hex");
      expect((result as any).value).toBe("#ff0000");
    });

    it("should create hex color with 6 digits", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable c: Color.Hex = #abcdef;
        return c;
      `,
      );

      expect((result as any).value).toBe("#abcdef");
    });

    it("should create hex color with 3 digits", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable c: Color.Hex = #abc;
        return c;
      `,
      );

      expect((result as any).value).toBe("#abc");
    });
  });

  describe("Edge Cases", () => {
    it("should handle lowercase hex", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable c: Color.Hex = #ffffff;
        return c;
      `,
      );

      expect((result as any).value).toBe("#ffffff");
    });

    it("should handle uppercase hex", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable c: Color.Hex = #FFFFFF;
        return c;
      `,
      );

      expect((result as any).value).toBe("#FFFFFF");
    });

    it("should handle black color", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable c: Color.Hex = #000000;
        return c;
      `,
      );

      expect((result as any).value).toBe("#000000");
    });

    it("should handle white color", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable c: Color.Hex = #ffffff;
        return c;
      `,
      );

      expect((result as any).value).toBe("#ffffff");
    });
  });

  describe("Alpha Channel Support", () => {
    it("should allow setting alpha on hex color", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable hex: Color.Hex = #ff0000;
        hex.alpha = 0.7;
        hex.alpha
      `,
      );

      expect((result as any).value).toBe(0.7);
    });

    // Note: Conversion tests are in rgb-color/unit.test.ts since RGB owns the conversions
  });

  describe("Conversions", () => {
    it("should convert sRGB to hex (red)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.SRGB;
        color.r = 1; color.g = 0; color.b = 0;
        color.to.hex()
        `,
      );

      expect((result as any).value).toBe("#ff0000");
    });

    it("should convert sRGB to hex (green)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.SRGB;
        color.r = 0; color.g = 1; color.b = 0;
        color.to.hex()
        `,
      );

      expect((result as any).value).toBe("#00ff00");
    });

    it("should convert sRGB to hex (blue)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.SRGB;
        color.r = 0; color.g = 0; color.b = 1;
        color.to.hex()
        `,
      );

      expect((result as any).value).toBe("#0000ff");
    });

    it("should convert sRGB to hex (mid values)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.SRGB;
        color.r = 0.5; color.g = 0.5; color.b = 0.5;
        color.to.hex()
        `,
      );

      // 0.5 * 255 = 127.5, rounds to 128 = 0x80
      expect((result as any).value).toBe("#808080");
    });

    it("should convert sRGB to hex (black)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.SRGB;
        color.r = 0; color.g = 0; color.b = 0;
        color.to.hex()
        `,
      );

      expect((result as any).value).toBe("#000000");
    });

    it("should convert sRGB to hex (white)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.SRGB;
        color.r = 1; color.g = 1; color.b = 1;
        color.to.hex()
        `,
      );

      expect((result as any).value).toBe("#ffffff");
    });

    // P3 to Hex conversions
    it("should convert P3 to hex (red)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.P3;
        color.r = 1; color.g = 0; color.b = 0;
        color.to.hex()
        `,
      );

      expect((result as any).value).toBe("#ff0000");
    });

    it("should convert P3 to hex (clamps out-of-gamut)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.P3;
        color.r = 1.2; color.g = -0.1; color.b = 0.5;
        color.to.hex()
        `,
      );

      // 1.2 clamps to 1 (ff), -0.1 clamps to 0 (00), 0.5 = 80
      expect((result as any).value).toBe("#ff0080");
    });

    // HSL to Hex conversions
    it("should convert HSL to hex (red)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.HSL;
        color.h = 0; color.s = 1; color.l = 0.5;
        color.to.hex()
        `,
      );

      expect((result as any).value).toBe("#ff0000");
    });

    it("should convert HSL to hex (green)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.HSL;
        color.h = 120; color.s = 1; color.l = 0.5;
        color.to.hex()
        `,
      );

      expect((result as any).value).toBe("#00ff00");
    });

    it("should convert HSL to hex (blue)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.HSL;
        color.h = 240; color.s = 1; color.l = 0.5;
        color.to.hex()
        `,
      );

      expect((result as any).value).toBe("#0000ff");
    });

    it("should convert HSL to hex (gray - no saturation)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.HSL;
        color.h = 0; color.s = 0; color.l = 0.5;
        color.to.hex()
        `,
      );

      expect((result as any).value).toBe("#808080");
    });

    // OKLCH to Hex conversions
    it("should convert OKLCH to hex (red-ish)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.OKLCH;
        color.l = 0.628; color.c = 0.258; color.h = 29;
        color.to.hex()
        `,
      );

      // OKLCH red is approximately l=0.628, c=0.258, h=29
      // Should produce something close to #ff0000
      const hex = (result as any).value as string;
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
      // Red channel should be high
      const r = parseInt(hex.slice(1, 3), 16);
      expect(r).toBeGreaterThan(200);
    });

    it("should convert OKLCH to hex (white)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.OKLCH;
        color.l = 1; color.c = 0; color.h = 0;
        color.to.hex()
        `,
      );

      expect((result as any).value).toBe("#ffffff");
    });

    it("should convert OKLCH to hex (black)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.OKLCH;
        color.l = 0; color.c = 0; color.h = 0;
        color.to.hex()
        `,
      );

      expect((result as any).value).toBe("#000000");
    });

    it("should convert OKLCH to hex (gray)", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable color: Color.OKLCH;
        color.l = 0.6; color.c = 0; color.h = 0;
        color.to.hex()
        `,
      );

      // Gray with lightness 0.6 should be mid-gray
      const hex = (result as any).value as string;
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      // Should be achromatic (r ≈ g ≈ b)
      expect(Math.abs(r - g)).toBeLessThan(2);
      expect(Math.abs(g - b)).toBeLessThan(2);
    });
  });
});
