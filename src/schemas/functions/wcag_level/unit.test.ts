/**
 * Unit tests for the wcag_level function
 * Returns WCAG compliance level for a color pair
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("wcag_level function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "wcag_level",
        "function"
      )) as FunctionSpecification;

      expect(schema.name).toBe("wcag_level");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should return AAA for black on white (ratio 21:1)", async () => {
      const result = await executeWithSchema(
        "wcag_level",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        wcag_level(black, white)
        `
      );

      expect(result).toBeDefined();
      const level = (result as any).value ?? result;
      expect(level).toBe("AAA");
    });

    it("should return AAA for white on black", async () => {
      const result = await executeWithSchema(
        "wcag_level",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        wcag_level(white, black)
        `
      );

      expect(result).toBeDefined();
      const level = (result as any).value ?? result;
      expect(level).toBe("AAA");
    });

    it("should return fail for low contrast colors", async () => {
      const result = await executeWithSchema(
        "wcag_level",
        "function",
        `
        variable light_gray: Color.SRGB;
        light_gray.r = 0.8; light_gray.g = 0.8; light_gray.b = 0.8;
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        wcag_level(light_gray, white)
        `
      );

      expect(result).toBeDefined();
      const level = (result as any).value ?? result;
      expect(level).toBe("fail");
    });
  });
});
