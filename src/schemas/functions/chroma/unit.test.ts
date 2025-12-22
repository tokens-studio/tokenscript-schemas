/**
 * Unit tests for the chroma function
 * Extracts chroma (colorfulness) from a color
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("chroma function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("chroma", "function")) as FunctionSpecification;

      expect(schema.name).toBe("chroma");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should return 0 for gray", async () => {
      const result = await executeWithSchema(
        "chroma",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        chroma(gray)
        `,
      );

      expect(result).toBeDefined();
      const c = (result as any).value ?? result;
      expect(c).toBeCloseTo(0, 2);
    });

    it("should return 0 for white", async () => {
      const result = await executeWithSchema(
        "chroma",
        "function",
        `
        variable white: Color.SRGB;
        white.r = 1; white.g = 1; white.b = 1;
        chroma(white)
        `,
      );

      expect(result).toBeDefined();
      const c = (result as any).value ?? result;
      expect(c).toBeCloseTo(0, 2);
    });

    it("should return 0 for black", async () => {
      const result = await executeWithSchema(
        "chroma",
        "function",
        `
        variable black: Color.SRGB;
        black.r = 0; black.g = 0; black.b = 0;
        chroma(black)
        `,
      );

      expect(result).toBeDefined();
      const c = (result as any).value ?? result;
      expect(c).toBeCloseTo(0, 2);
    });

    it("should return high chroma for saturated red", async () => {
      const result = await executeWithSchema(
        "chroma",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        chroma(red)
        `,
      );

      expect(result).toBeDefined();
      const c = (result as any).value ?? result;
      // Red has high chroma in OKLCH
      expect(c).toBeGreaterThan(0.2);
    });
  });
});
