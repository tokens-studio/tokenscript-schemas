import { describe, test, expect } from "vitest";
import {
  executeScript,
  loadSchemaScript,
} from "../../../../tests/helpers/schema-test-utils.js";

describe("RGBA Color Conversions", () => {
  describe("RGBA to Hex", () => {
    test("converts red RGBA to hex", async () => {
      const script = await loadSchemaScript("rgba-color", "type", "to-hex-color");

      const result = await executeScript<
        { r: number; g: number; b: number; a: number },
        string
      >(script, { r: 255, g: 0, b: 0, a: 1 });

      expect(result.toLowerCase()).toBe("#ff0000ff");
    });

    test("converts green RGBA to hex", async () => {
      const script = await loadSchemaScript("rgba-color", "type", "to-hex-color");

      const result = await executeScript<
        { r: number; g: number; b: number; a: number },
        string
      >(script, { r: 0, g: 255, b: 0, a: 1 });

      expect(result.toLowerCase()).toBe("#00ff00ff");
    });

    test("converts blue RGBA to hex", async () => {
      const script = await loadSchemaScript("rgba-color", "type", "to-hex-color");

      const result = await executeScript<
        { r: number; g: number; b: number; a: number },
        string
      >(script, { r: 0, g: 0, b: 255, a: 1 });

      expect(result.toLowerCase()).toBe("#0000ffff");
    });

    test("converts black RGBA to hex", async () => {
      const script = await loadSchemaScript("rgba-color", "type", "to-hex-color");

      const result = await executeScript<
        { r: number; g: number; b: number; a: number },
        string
      >(script, { r: 0, g: 0, b: 0, a: 1 });

      expect(result.toLowerCase()).toBe("#000000ff");
    });

    test("converts white RGBA to hex", async () => {
      const script = await loadSchemaScript("rgba-color", "type", "to-hex-color");

      const result = await executeScript<
        { r: number; g: number; b: number; a: number },
        string
      >(script, { r: 255, g: 255, b: 255, a: 1 });

      expect(result.toLowerCase()).toBe("#ffffffff");
    });

    test("converts RGBA with 50% alpha to hex", async () => {
      const script = await loadSchemaScript("rgba-color", "type", "to-hex-color");

      const result = await executeScript<
        { r: number; g: number; b: number; a: number },
        string
      >(script, { r: 255, g: 0, b: 0, a: 0.5 });

      expect(result.toLowerCase()).toBe("#ff000080");
    });

    test("converts RGBA with zero alpha to hex", async () => {
      const script = await loadSchemaScript("rgba-color", "type", "to-hex-color");

      const result = await executeScript<
        { r: number; g: number; b: number; a: number },
        string
      >(script, { r: 255, g: 128, b: 64, a: 0 });

      expect(result.toLowerCase()).toBe("#ff804000");
    });
  });

  describe("Hex to RGBA", () => {
    test("converts 8-digit hex to RGBA", async () => {
      const script = await loadSchemaScript("rgba-color", "type", "from-hex-color");

      const result = await executeScript<
        string,
        { r: number; g: number; b: number; a: number }
      >(script, "#ff0000ff");

      expect(result.r).toBe(255);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
      expect(result.a).toBeCloseTo(1, 2);
    });

    test("converts 6-digit hex to RGBA with default alpha", async () => {
      const script = await loadSchemaScript("rgba-color", "type", "from-hex-color");

      const result = await executeScript<
        string,
        { r: number; g: number; b: number; a: number }
      >(script, "#00ff00");

      expect(result.r).toBe(0);
      expect(result.g).toBe(255);
      expect(result.b).toBe(0);
      expect(result.a).toBeCloseTo(1, 2);
    });

    test("converts hex with 50% alpha to RGBA", async () => {
      const script = await loadSchemaScript("rgba-color", "type", "from-hex-color");

      const result = await executeScript<
        string,
        { r: number; g: number; b: number; a: number }
      >(script, "#ff000080");

      expect(result.r).toBe(255);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
      expect(result.a).toBeCloseTo(0.5, 1);
    });
  });

  describe("RGBA to RGB", () => {
    test("strips alpha channel from RGBA", async () => {
      const script = await loadSchemaScript("rgba-color", "type", "to-rgb-color");

      const result = await executeScript<
        { r: number; g: number; b: number; a: number },
        { r: number; g: number; b: number }
      >(script, { r: 255, g: 128, b: 64, a: 0.5 });

      expect(result.r).toBe(255);
      expect(result.g).toBe(128);
      expect(result.b).toBe(64);
      expect(result.a).toBeUndefined();
    });
  });

  describe("RGB to RGBA", () => {
    test("adds default alpha channel to RGB", async () => {
      const script = await loadSchemaScript("rgba-color", "type", "from-rgb-color");

      const result = await executeScript<
        { r: number; g: number; b: number },
        { r: number; g: number; b: number; a: number }
      >(script, { r: 255, g: 128, b: 64 });

      expect(result.r).toBe(255);
      expect(result.g).toBe(128);
      expect(result.b).toBe(64);
      expect(result.a).toBeCloseTo(1, 2);
    });
  });

  describe("Round-trip conversions", () => {
    test("preserves color values in RGBA -> Hex -> RGBA", async () => {
      const toHexScript = await loadSchemaScript("rgba-color", "type", "to-hex-color");
      const fromHexScript = await loadSchemaScript("rgba-color", "type", "from-hex-color");

      const testCases = [
        { r: 123, g: 45, b: 67, a: 0.8 },
        { r: 255, g: 0, b: 128, a: 1 },
        { r: 0, g: 0, b: 0, a: 0.5 },
      ];

      for (const originalRgba of testCases) {
        const hex = await executeScript<
          { r: number; g: number; b: number; a: number },
          string
        >(toHexScript, originalRgba);

        const resultRgba = await executeScript<
          string,
          { r: number; g: number; b: number; a: number }
        >(fromHexScript, hex);

        expect(resultRgba.r).toBe(originalRgba.r);
        expect(resultRgba.g).toBe(originalRgba.g);
        expect(resultRgba.b).toBe(originalRgba.b);
        expect(resultRgba.a).toBeCloseTo(originalRgba.a, 1);
      }
    });
  });
});
