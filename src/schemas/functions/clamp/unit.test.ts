/**
 * Unit tests for the clamp function
 * Constrains a number between min and max bounds
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("clamp function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("clamp", "function")) as FunctionSpecification;

      expect(schema.name).toBe("clamp");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should return value unchanged when within bounds", async () => {
      const result = await executeWithSchema(
        "clamp",
        "function",
        `
        clamp(5, 0, 10)
        `,
      );

      expect(result).toBeDefined();
      const value = (result as any).value ?? result;
      expect(value).toBe(5);
    });

    it("should return min when value is below minimum", async () => {
      const result = await executeWithSchema(
        "clamp",
        "function",
        `
        clamp(-5, 0, 10)
        `,
      );

      expect(result).toBeDefined();
      const value = (result as any).value ?? result;
      expect(value).toBe(0);
    });

    it("should return max when value is above maximum", async () => {
      const result = await executeWithSchema(
        "clamp",
        "function",
        `
        clamp(15, 0, 10)
        `,
      );

      expect(result).toBeDefined();
      const value = (result as any).value ?? result;
      expect(value).toBe(10);
    });

    it("should return min when value equals min boundary", async () => {
      const result = await executeWithSchema(
        "clamp",
        "function",
        `
        clamp(0, 0, 10)
        `,
      );

      expect(result).toBeDefined();
      const value = (result as any).value ?? result;
      expect(value).toBe(0);
    });

    it("should return max when value equals max boundary", async () => {
      const result = await executeWithSchema(
        "clamp",
        "function",
        `
        clamp(10, 0, 10)
        `,
      );

      expect(result).toBeDefined();
      const value = (result as any).value ?? result;
      expect(value).toBe(10);
    });

    it("should work with negative numbers", async () => {
      const result = await executeWithSchema(
        "clamp",
        "function",
        `
        clamp(-15, -10, -5)
        `,
      );

      expect(result).toBeDefined();
      const value = (result as any).value ?? result;
      expect(value).toBe(-10);
    });

    it("should work with decimal values", async () => {
      const result = await executeWithSchema(
        "clamp",
        "function",
        `
        clamp(0.75, 0.0, 1.0)
        `,
      );

      expect(result).toBeDefined();
      const value = (result as any).value ?? result;
      expect(value).toBeCloseTo(0.75, 5);
    });

    it("should clamp decimal value above max", async () => {
      const result = await executeWithSchema(
        "clamp",
        "function",
        `
        clamp(1.5, 0.0, 1.0)
        `,
      );

      expect(result).toBeDefined();
      const value = (result as any).value ?? result;
      expect(value).toBeCloseTo(1.0, 5);
    });

    it("should clamp decimal value below min", async () => {
      const result = await executeWithSchema(
        "clamp",
        "function",
        `
        clamp(-0.5, 0.0, 1.0)
        `,
      );

      expect(result).toBeDefined();
      const value = (result as any).value ?? result;
      expect(value).toBeCloseTo(0.0, 5);
    });
  });
});
