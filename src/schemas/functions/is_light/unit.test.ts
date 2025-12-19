/**
 * Unit tests for the Is Light function
 * Checks if a color is perceptually light
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Is Light Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("is_light", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Is Light");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("is_light");
    });
  });

  describe("Function Execution", () => {
    it("should return true for white", async () => {
      const result = await executeWithSchema(
        "is_light",
        "function",
        `
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        is_light(white)
        `,
      );

      expect(result).toBeDefined();
      const isLight = (result as any).value ?? result;
      expect(isLight).toBe(true);
    });

    it("should return false for black", async () => {
      const result = await executeWithSchema(
        "is_light",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        is_light(black)
        `,
      );

      expect(result).toBeDefined();
      const isLight = (result as any).value ?? result;
      expect(isLight).toBe(false);
    });

    it("should return true for light yellow", async () => {
      const result = await executeWithSchema(
        "is_light",
        "function",
        `
        variable yellow: Color.SRGB;
        yellow.r = 1; yellow.g = 0.95; yellow.b = 0.6;
        is_light(yellow)
        `,
      );

      expect(result).toBeDefined();
      const isLight = (result as any).value ?? result;
      expect(isLight).toBe(true);
    });

    it("should return false for dark blue", async () => {
      const result = await executeWithSchema(
        "is_light",
        "function",
        `
        variable darkBlue: Color.SRGB;
        darkBlue.r = 0.1; darkBlue.g = 0.1; darkBlue.b = 0.3;
        is_light(darkBlue)
        `,
      );

      expect(result).toBeDefined();
      const isLight = (result as any).value ?? result;
      expect(isLight).toBe(false);
    });
  });
});
