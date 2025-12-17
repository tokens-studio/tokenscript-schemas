import { describe, test, expect } from "vitest";
import {
  executeScript,
  loadSchemaScript,
} from "../../../../tests/helpers/schema-test-utils.js";

describe("HSL Color Conversions", () => {
  describe("HSL to SRGB", () => {
    test("converts red HSL to SRGB", async () => {
      const script = await loadSchemaScript("hsl-color", "type", "hsl-color-to-srgb-color");

      const result = await executeScript<
        { h: number; s: number; l: number },
        { r: number; g: number; b: number }
      >(script, { h: 0, s: 100, l: 50 });

      expect(result.r).toBeCloseTo(255, 0);
      expect(result.g).toBeCloseTo(0, 0);
      expect(result.b).toBeCloseTo(0, 0);
    });

    test("converts green HSL to SRGB", async () => {
      const script = await loadSchemaScript("hsl-color", "type", "hsl-color-to-srgb-color");

      const result = await executeScript<
        { h: number; s: number; l: number },
        { r: number; g: number; b: number }
      >(script, { h: 120, s: 100, l: 50 });

      expect(result.r).toBeCloseTo(0, 0);
      expect(result.g).toBeCloseTo(255, 0);
      expect(result.b).toBeCloseTo(0, 0);
    });

    test("converts blue HSL to SRGB", async () => {
      const script = await loadSchemaScript("hsl-color", "type", "hsl-color-to-srgb-color");

      const result = await executeScript<
        { h: number; s: number; l: number },
        { r: number; g: number; b: number }
      >(script, { h: 240, s: 100, l: 50 });

      expect(result.r).toBeCloseTo(0, 0);
      expect(result.g).toBeCloseTo(0, 0);
      expect(result.b).toBeCloseTo(255, 0);
    });

    test("converts cyan HSL to SRGB", async () => {
      const script = await loadSchemaScript("hsl-color", "type", "hsl-color-to-srgb-color");

      const result = await executeScript<
        { h: number; s: number; l: number },
        { r: number; g: number; b: number }
      >(script, { h: 180, s: 100, l: 50 });

      expect(result.r).toBeCloseTo(0, 0);
      expect(result.g).toBeCloseTo(255, 0);
      expect(result.b).toBeCloseTo(255, 0);
    });

    test("converts magenta HSL to SRGB", async () => {
      const script = await loadSchemaScript("hsl-color", "type", "hsl-color-to-srgb-color");

      const result = await executeScript<
        { h: number; s: number; l: number },
        { r: number; g: number; b: number }
      >(script, { h: 300, s: 100, l: 50 });

      expect(result.r).toBeCloseTo(255, 0);
      expect(result.g).toBeCloseTo(0, 0);
      expect(result.b).toBeCloseTo(255, 0);
    });

    test("converts yellow HSL to SRGB", async () => {
      const script = await loadSchemaScript("hsl-color", "type", "hsl-color-to-srgb-color");

      const result = await executeScript<
        { h: number; s: number; l: number },
        { r: number; g: number; b: number }
      >(script, { h: 60, s: 100, l: 50 });

      expect(result.r).toBeCloseTo(255, 0);
      expect(result.g).toBeCloseTo(255, 0);
      expect(result.b).toBeCloseTo(0, 0);
    });

    test("converts black HSL to SRGB", async () => {
      const script = await loadSchemaScript("hsl-color", "type", "hsl-color-to-srgb-color");

      const result = await executeScript<
        { h: number; s: number; l: number },
        { r: number; g: number; b: number }
      >(script, { h: 0, s: 0, l: 0 });

      expect(result.r).toBeCloseTo(0, 0);
      expect(result.g).toBeCloseTo(0, 0);
      expect(result.b).toBeCloseTo(0, 0);
    });

    test("converts white HSL to SRGB", async () => {
      const script = await loadSchemaScript("hsl-color", "type", "hsl-color-to-srgb-color");

      const result = await executeScript<
        { h: number; s: number; l: number },
        { r: number; g: number; b: number }
      >(script, { h: 0, s: 0, l: 100 });

      expect(result.r).toBeCloseTo(255, 0);
      expect(result.g).toBeCloseTo(255, 0);
      expect(result.b).toBeCloseTo(255, 0);
    });

    test("converts gray HSL to SRGB", async () => {
      const script = await loadSchemaScript("hsl-color", "type", "hsl-color-to-srgb-color");

      const result = await executeScript<
        { h: number; s: number; l: number },
        { r: number; g: number; b: number }
      >(script, { h: 0, s: 0, l: 50 });

      expect(result.r).toBeCloseTo(127.5, 0);
      expect(result.g).toBeCloseTo(127.5, 0);
      expect(result.b).toBeCloseTo(127.5, 0);
    });

    test("produces valid RGB output for various inputs", async () => {
      const script = await loadSchemaScript("hsl-color", "type", "hsl-color-to-srgb-color");

      const testCases = [
        { h: 0, s: 50, l: 75 },
        { h: 120, s: 25, l: 25 },
        { h: 200, s: 75, l: 60 },
        { h: 330, s: 90, l: 40 },
      ];

      for (const input of testCases) {
        const result = await executeScript<
          { h: number; s: number; l: number },
          { r: number; g: number; b: number }
        >(script, input);

        expect(result.r).toBeGreaterThanOrEqual(0);
        expect(result.r).toBeLessThanOrEqual(255);
        expect(result.g).toBeGreaterThanOrEqual(0);
        expect(result.g).toBeLessThanOrEqual(255);
        expect(result.b).toBeGreaterThanOrEqual(0);
        expect(result.b).toBeLessThanOrEqual(255);
      }
    });
  });

  describe("SRGB to HSL", () => {
    test("converts red SRGB to HSL", async () => {
      const script = await loadSchemaScript("hsl-color", "type", "srgb-color-to-hsl-color");

      const result = await executeScript<
        { r: number; g: number; b: number },
        { h: number; s: number; l: number }
      >(script, { r: 255, g: 0, b: 0 });

      expect(result.h).toBeCloseTo(0, 0);
      expect(result.s).toBeCloseTo(100, 0);
      expect(result.l).toBeCloseTo(50, 0);
    });

    test("converts green SRGB to HSL", async () => {
      const script = await loadSchemaScript("hsl-color", "type", "srgb-color-to-hsl-color");

      const result = await executeScript<
        { r: number; g: number; b: number },
        { h: number; s: number; l: number }
      >(script, { r: 0, g: 255, b: 0 });

      expect(result.h).toBeCloseTo(120, 0);
      expect(result.s).toBeCloseTo(100, 0);
      expect(result.l).toBeCloseTo(50, 0);
    });

    test("converts blue SRGB to HSL", async () => {
      const script = await loadSchemaScript("hsl-color", "type", "srgb-color-to-hsl-color");

      const result = await executeScript<
        { r: number; g: number; b: number },
        { h: number; s: number; l: number }
      >(script, { r: 0, g: 0, b: 255 });

      expect(result.h).toBeCloseTo(240, 0);
      expect(result.s).toBeCloseTo(100, 0);
      expect(result.l).toBeCloseTo(50, 0);
    });

    test("converts black SRGB to HSL", async () => {
      const script = await loadSchemaScript("hsl-color", "type", "srgb-color-to-hsl-color");

      const result = await executeScript<
        { r: number; g: number; b: number },
        { h: number; s: number; l: number }
      >(script, { r: 0, g: 0, b: 0 });

      expect(result.h).toBeDefined();
      expect(result.s).toBeCloseTo(0, 0);
      expect(result.l).toBeCloseTo(0, 0);
    });

    test("converts white SRGB to HSL", async () => {
      const script = await loadSchemaScript("hsl-color", "type", "srgb-color-to-hsl-color");

      const result = await executeScript<
        { r: number; g: number; b: number },
        { h: number; s: number; l: number }
      >(script, { r: 255, g: 255, b: 255 });

      expect(result.h).toBeDefined();
      expect(result.s).toBeCloseTo(0, 0);
      expect(result.l).toBeCloseTo(100, 0);
    });
  });

  describe("Round-trip conversions", () => {
    test("preserves color values in HSL -> SRGB -> HSL", async () => {
      const toSrgbScript = await loadSchemaScript("hsl-color", "type", "hsl-color-to-srgb-color");
      const toHslScript = await loadSchemaScript("hsl-color", "type", "srgb-color-to-hsl-color");

      const testCases = [
        { h: 200, s: 75, l: 60 },
        { h: 120, s: 100, l: 50 },
        { h: 330, s: 50, l: 40 },
      ];

      for (const originalHsl of testCases) {
        const rgb = await executeScript<
          { h: number; s: number; l: number },
          { r: number; g: number; b: number }
        >(toSrgbScript, originalHsl);

        const resultHsl = await executeScript<
          { r: number; g: number; b: number },
          { h: number; s: number; l: number }
        >(toHslScript, rgb);

        expect(resultHsl.h).toBeCloseTo(originalHsl.h, 0);
        expect(resultHsl.s).toBeCloseTo(originalHsl.s, 0);
        expect(resultHsl.l).toBeCloseTo(originalHsl.l, 0);
      }
    });
  });
});
