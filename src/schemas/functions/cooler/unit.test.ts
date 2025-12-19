/**
 * Unit tests for the cooler function
 * Shifts hue towards cool colors
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("cooler function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "cooler",
        "function"
      )) as FunctionSpecification;

      expect(schema.name).toBe("cooler");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should shift red towards cool (purple)", async () => {
      const result = await executeWithSchema(
        "cooler",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        cooler(red, 0.5)
        `
      );

      expect(result).toBeDefined();
      // Red shifted cool should have more blue
      const b = (result as any).value?.b?.value ?? (result as any).value?.b;
      expect(b).toBeGreaterThan(0.1);
    });

    it("should shift yellow towards cool (green)", async () => {
      const result = await executeWithSchema(
        "cooler",
        "function",
        `
        variable yellow: Color.SRGB;
        yellow.r = 1; yellow.g = 1; yellow.b = 0;
        cooler(yellow, 0.5)
        `
      );

      expect(result).toBeDefined();
      // Yellow shifted cool should have reduced red or increased blue
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeLessThan(1);
    });

    it("should use default amount if not provided", async () => {
      const result = await executeWithSchema(
        "cooler",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        cooler(red)
        `
      );

      expect(result).toBeDefined();
    });
  });
});

