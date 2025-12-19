/**
 * Unit tests for the sepia function
 * Applies sepia tone transformation
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("sepia function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "sepia",
        "function"
      )) as FunctionSpecification;

      expect(schema.name).toBe("sepia");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should apply full sepia tone to gray", async () => {
      const result = await executeWithSchema(
        "sepia",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        sepia(gray, 1)
        `
      );

      expect(result).toBeDefined();
      // Sepia should have more red than blue
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const b = (result as any).value?.b?.value ?? (result as any).value?.b;
      expect(r).toBeGreaterThan(b);
    });

    it("should apply partial sepia with amount 0.5", async () => {
      const result = await executeWithSchema(
        "sepia",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        sepia(gray, 0.5)
        `
      );

      expect(result).toBeDefined();
      // Partial sepia still has warm tint
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const b = (result as any).value?.b?.value ?? (result as any).value?.b;
      expect(r).toBeGreaterThan(b);
    });

    it("should return original color with amount 0", async () => {
      const result = await executeWithSchema(
        "sepia",
        "function",
        `
        variable blue: Color.SRGB;
        blue.r = 0; blue.g = 0; blue.b = 1;
        sepia(blue, 0)
        `
      );

      expect(result).toBeDefined();
      // Should be unchanged
      const b = (result as any).value?.b?.value ?? (result as any).value?.b;
      expect(b).toBeCloseTo(1, 1);
    });

    it("should use default amount if not provided", async () => {
      const result = await executeWithSchema(
        "sepia",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        sepia(gray)
        `
      );

      expect(result).toBeDefined();
    });
  });
});

