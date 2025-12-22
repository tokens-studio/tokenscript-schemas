/**
 * Unit tests for the is_neutral function
 * Checks if a color is achromatic (gray)
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("is_neutral function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("is_neutral", "function")) as FunctionSpecification;

      expect(schema.name).toBe("is_neutral");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should return true for pure gray", async () => {
      const result = await executeWithSchema(
        "is_neutral",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        is_neutral(gray)
        `,
      );

      expect(result).toBeDefined();
      const neutral = (result as any).value ?? result;
      expect(neutral).toBe(true);
    });

    it("should return true for white", async () => {
      const result = await executeWithSchema(
        "is_neutral",
        "function",
        `
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        is_neutral(white)
        `,
      );

      expect(result).toBeDefined();
      const neutral = (result as any).value ?? result;
      expect(neutral).toBe(true);
    });

    it("should return true for black", async () => {
      const result = await executeWithSchema(
        "is_neutral",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        is_neutral(black)
        `,
      );

      expect(result).toBeDefined();
      const neutral = (result as any).value ?? result;
      expect(neutral).toBe(true);
    });

    it("should return false for saturated red", async () => {
      const result = await executeWithSchema(
        "is_neutral",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        is_neutral(red)
        `,
      );

      expect(result).toBeDefined();
      const neutral = (result as any).value ?? result;
      expect(neutral).toBe(false);
    });
  });
});
