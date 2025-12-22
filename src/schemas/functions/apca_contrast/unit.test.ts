import { executeWithSchema } from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";
import { describe, expect, it } from "vitest";

describe("APCA Contrast Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const { getBundledSchema } = await import("@tests/helpers/schema-test-utils");
      const schema = await getBundledSchema("apca_contrast", "function");

      expect(schema.name).toBe("APCA Contrast");
      expect(schema.type).toBe("function");
      expect((schema as any).keyword).toBe("apca_contrast");
    });
  });

  describe("Basic Contrast Calculations", () => {
    it("should return high positive contrast for black text on white background", async () => {
      // Black text on white background = dark on light = POSITIVE Lc
      const result = await executeWithSchema(
        "apca_contrast",
        "function",
        `
        variable text: Color.SRGB;
        text.r = 0; text.g = 0; text.b = 0;
        variable bg: Color.SRGB;
        bg.r = 1; bg.g = 1; bg.b = 1;
        apca_contrast(text, bg)
        `,
      );

      expect(typeof result.value).toBe("number");
      expect(result.value).toBeGreaterThan(100); // Should be around +106
    });

    it("should return high negative contrast for white text on black background", async () => {
      // White text on black background = light on dark = NEGATIVE Lc
      const result = await executeWithSchema(
        "apca_contrast",
        "function",
        `
        variable text: Color.SRGB;
        text.r = 1; text.g = 1; text.b = 1;
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 0; bg.b = 0;
        apca_contrast(text, bg)
        `,
      );

      expect(typeof result.value).toBe("number");
      expect(result.value).toBeLessThan(-100); // Should be around -108
    });

    it("should return zero contrast for identical colors", async () => {
      const result = await executeWithSchema(
        "apca_contrast",
        "function",
        `
        variable text: Color.SRGB;
        text.r = 0.5; text.g = 0.5; text.b = 0.5;
        variable bg: Color.SRGB;
        bg.r = 0.5; bg.g = 0.5; bg.b = 0.5;
        apca_contrast(text, bg)
        `,
      );

      expect(result.value).toBeCloseTo(0, 1);
    });
  });

  describe("Polarity (BoW vs WoB)", () => {
    it("should return positive for dark text on light background", async () => {
      // Dark on light = POSITIVE (per APCA spec)
      const result = await executeWithSchema(
        "apca_contrast",
        "function",
        `
        variable text: Color.SRGB;
        text.r = 0.2; text.g = 0.2; text.b = 0.2;
        variable bg: Color.SRGB;
        bg.r = 0.9; bg.g = 0.9; bg.b = 0.9;
        apca_contrast(text, bg)
        `,
      );

      expect(result.value).toBeGreaterThan(0);
    });

    it("should return negative for light text on dark background", async () => {
      // Light on dark = NEGATIVE (per APCA spec)
      const result = await executeWithSchema(
        "apca_contrast",
        "function",
        `
        variable text: Color.SRGB;
        text.r = 0.9; text.g = 0.9; text.b = 0.9;
        variable bg: Color.SRGB;
        bg.r = 0.2; bg.g = 0.2; bg.b = 0.2;
        apca_contrast(text, bg)
        `,
      );

      expect(result.value).toBeLessThan(0);
    });
  });

  describe("Color.js Parity", () => {
    // Note: In Color.js, colorObj.contrast(other, "APCA") treats:
    //   - colorObj as BACKGROUND
    //   - other as FOREGROUND (text)
    // Our apca_contrast(text, bg) uses opposite order:
    //   - text as FOREGROUND
    //   - bg as BACKGROUND
    // So apca_contrast(A, B) should match B.contrast(A, "APCA")

    it("should match Color.js APCA for black text on white background", async () => {
      const result = await executeWithSchema(
        "apca_contrast",
        "function",
        `
        variable text: Color.SRGB;
        text.r = 0; text.g = 0; text.b = 0;
        variable bg: Color.SRGB;
        bg.r = 1; bg.g = 1; bg.b = 1;
        apca_contrast(text, bg)
        `,
      );

      // apca_contrast(black, white) = black text on white bg
      // In Color.js: white.contrast(black, "APCA") = black fg on white bg
      const white = new Color("srgb", [1, 1, 1]);
      const black = new Color("srgb", [0, 0, 0]);
      const colorJsApca = white.contrast(black, "APCA");

      expect(result.value).toBeCloseTo(colorJsApca, 0);
    });

    it("should match Color.js APCA for white text on black background", async () => {
      const result = await executeWithSchema(
        "apca_contrast",
        "function",
        `
        variable text: Color.SRGB;
        text.r = 1; text.g = 1; text.b = 1;
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 0; bg.b = 0;
        apca_contrast(text, bg)
        `,
      );

      // apca_contrast(white, black) = white text on black bg
      // In Color.js: black.contrast(white, "APCA") = white fg on black bg
      const white = new Color("srgb", [1, 1, 1]);
      const black = new Color("srgb", [0, 0, 0]);
      const colorJsApca = black.contrast(white, "APCA");

      expect(result.value).toBeCloseTo(colorJsApca, 0);
    });

    it("should match Color.js APCA for blue text on light gray", async () => {
      const result = await executeWithSchema(
        "apca_contrast",
        "function",
        `
        variable text: Color.SRGB;
        text.r = 0.2; text.g = 0.4; text.b = 0.8;
        variable bg: Color.SRGB;
        bg.r = 0.95; bg.g = 0.95; bg.b = 0.95;
        apca_contrast(text, bg)
        `,
      );

      // apca_contrast(blue, lightGray) = blue text on lightGray bg
      // In Color.js: lightGray.contrast(blue, "APCA")
      const blue = new Color("srgb", [0.2, 0.4, 0.8]);
      const lightGray = new Color("srgb", [0.95, 0.95, 0.95]);
      const colorJsApca = lightGray.contrast(blue, "APCA");

      expect(result.value).toBeCloseTo(colorJsApca, 0);
    });

    it("should match Color.js APCA for mid-contrast scenario", async () => {
      const result = await executeWithSchema(
        "apca_contrast",
        "function",
        `
        variable text: Color.SRGB;
        text.r = 0.4; text.g = 0.4; text.b = 0.4;
        variable bg: Color.SRGB;
        bg.r = 0.8; bg.g = 0.8; bg.b = 0.8;
        apca_contrast(text, bg)
        `,
      );

      const darkGray = new Color("srgb", [0.4, 0.4, 0.4]);
      const lightGray = new Color("srgb", [0.8, 0.8, 0.8]);
      // darkGray text on lightGray bg → lightGray.contrast(darkGray)
      const colorJsApca = lightGray.contrast(darkGray, "APCA");

      expect(result.value).toBeCloseTo(colorJsApca, 0);
    });
  });

  describe("WCAG 3.0 Threshold Guidelines", () => {
    it("should meet body text threshold (|Lc| >= 60) for dark gray on white", async () => {
      const result = await executeWithSchema(
        "apca_contrast",
        "function",
        `
        variable text: Color.SRGB;
        text.r = 0.3; text.g = 0.3; text.b = 0.3;
        variable bg: Color.SRGB;
        bg.r = 1; bg.g = 1; bg.b = 1;
        apca_contrast(text, bg)
        `,
      );

      // Dark gray on white should be positive and meet body text requirements
      expect(result.value).toBeGreaterThan(60);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very dark colors (soft black clamp)", async () => {
      const result = await executeWithSchema(
        "apca_contrast",
        "function",
        `
        variable text: Color.SRGB;
        text.r = 0.01; text.g = 0.01; text.b = 0.01;
        variable bg: Color.SRGB;
        bg.r = 0.02; bg.g = 0.02; bg.b = 0.02;
        apca_contrast(text, bg)
        `,
      );

      // Very dark colors should still produce a valid result
      expect(typeof result.value).toBe("number");
      expect(Number.isFinite(result.value)).toBe(true);
    });

    it("should work with chromatic colors", async () => {
      const result = await executeWithSchema(
        "apca_contrast",
        "function",
        `
        variable text: Color.SRGB;
        text.r = 0.8; text.g = 0.2; text.b = 0.2;
        variable bg: Color.SRGB;
        bg.r = 0.2; bg.g = 0.6; bg.b = 0.2;
        apca_contrast(text, bg)
        `,
      );

      expect(typeof result.value).toBe("number");
      expect(Number.isFinite(result.value)).toBe(true);
    });
  });
});
