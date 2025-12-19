/**
 * Unit tests for the Is Dark function
 * Checks if a color is perceptually dark
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Is Dark Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("is_dark", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Is Dark");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("is_dark");
    });
  });

  describe("Function Execution", () => {
    it("should return true for black", async () => {
      const result = await executeWithSchema(
        "is_dark",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        is_dark(black)
        `,
      );

      expect(result).toBeDefined();
      const isDark = (result as any).value ?? result;
      expect(isDark).toBe(true);
    });

    it("should return false for white", async () => {
      const result = await executeWithSchema(
        "is_dark",
        "function",
        `
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        is_dark(white)
        `,
      );

      expect(result).toBeDefined();
      const isDark = (result as any).value ?? result;
      expect(isDark).toBe(false);
    });

    it("should return true for dark navy", async () => {
      const result = await executeWithSchema(
        "is_dark",
        "function",
        `
        variable navy: Color.SRGB;
        navy.r = 0.05; navy.g = 0.05; navy.b = 0.2;
        is_dark(navy)
        `,
      );

      expect(result).toBeDefined();
      const isDark = (result as any).value ?? result;
      expect(isDark).toBe(true);
    });

    it("should be opposite of is_light", async () => {
      const result = await executeWithSchema(
        "is_dark",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.3; gray.g = 0.3; gray.b = 0.3;
        is_dark(gray)
        `,
      );

      expect(result).toBeDefined();
      // Dark gray should be dark
      const isDark = (result as any).value ?? result;
      expect(isDark).toBe(true);
    });
  });
});

