/**
 * Unit tests for the muted function
 * Decreases chroma toward neutral
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("muted function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "muted",
        "function"
      )) as FunctionSpecification;

      expect(schema.name).toBe("muted");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should decrease saturation of vibrant colors", async () => {
      const result = await executeWithSchema(
        "muted",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        muted(red).to.srgb()
        `
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      // Muted red should have less extreme channel differences
      expect(r - g).toBeLessThan(0.9);
    });

    it("should produce gray with amount 1", async () => {
      const result = await executeWithSchema(
        "muted",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        muted(red, 1).to.srgb()
        `
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      const b = (result as any).value?.b?.value ?? (result as any).value?.b;
      // Should be gray
      expect(Math.abs(r - g)).toBeLessThan(0.05);
      expect(Math.abs(g - b)).toBeLessThan(0.05);
    });

    it("should have no effect with amount 0", async () => {
      const result = await executeWithSchema(
        "muted",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        muted(red, 0).to.srgb()
        `
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      const b = (result as any).value?.b?.value ?? (result as any).value?.b;
      // Should remain red
      expect(r).toBeCloseTo(1, 1);
      expect(g).toBeCloseTo(0, 1);
      expect(b).toBeCloseTo(0, 1);
    });

    it("should preserve gray (already muted)", async () => {
      const result = await executeWithSchema(
        "muted",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        muted(gray).to.srgb()
        `
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      const b = (result as any).value?.b?.value ?? (result as any).value?.b;
      // Gray should stay gray
      expect(Math.abs(r - g)).toBeLessThan(0.05);
      expect(Math.abs(g - b)).toBeLessThan(0.05);
    });
  });
});
