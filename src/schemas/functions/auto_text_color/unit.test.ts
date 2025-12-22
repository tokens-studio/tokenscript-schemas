/**
 * Unit tests for the auto_text_color function
 * Returns black or white for optimal contrast against a background
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("auto_text_color function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "auto_text_color",
        "function",
      )) as FunctionSpecification;

      expect(schema.name).toBe("auto_text_color");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should return white text for dark backgrounds", async () => {
      const result = await executeWithSchema(
        "auto_text_color",
        "function",
        `
        variable bg: Color.SRGB;
        bg.r = 0.1; bg.g = 0.1; bg.b = 0.1;
        auto_text_color(bg)
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeCloseTo(1, 1);
    });

    it("should return black text for light backgrounds", async () => {
      const result = await executeWithSchema(
        "auto_text_color",
        "function",
        `
        variable bg: Color.SRGB;
        bg.r = 0.94; bg.g = 0.94; bg.b = 0.94;
        auto_text_color(bg)
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeCloseTo(0, 1);
    });

    it("should return black text for pure white", async () => {
      const result = await executeWithSchema(
        "auto_text_color",
        "function",
        `
        variable bg: Color.SRGB;
        bg.r = 1; bg.g = 1; bg.b = 1;
        auto_text_color(bg)
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeCloseTo(0, 1);
    });

    it("should return white text for pure black", async () => {
      const result = await executeWithSchema(
        "auto_text_color",
        "function",
        `
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 0; bg.b = 0;
        auto_text_color(bg)
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeCloseTo(1, 1);
    });

    it("should return black text for bright yellow (high luminance)", async () => {
      const result = await executeWithSchema(
        "auto_text_color",
        "function",
        `
        variable bg: Color.SRGB;
        bg.r = 1; bg.g = 1; bg.b = 0;
        auto_text_color(bg)
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      // Yellow has high luminance -> black text
      expect(r).toBeCloseTo(0, 1);
    });

    it("should return white text for dark blue", async () => {
      const result = await executeWithSchema(
        "auto_text_color",
        "function",
        `
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 0.4; bg.b = 0.8;
        auto_text_color(bg)
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      // Blue has low luminance -> white text
      expect(r).toBeCloseTo(1, 1);
    });
  });
});
