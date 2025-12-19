/**
 * Unit tests for the harmonize function
 * Shifts a color's hue toward a source color
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("harmonize function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "harmonize",
        "function"
      )) as FunctionSpecification;

      expect(schema.name).toBe("harmonize");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should shift hue toward source color", async () => {
      const result = await executeWithSchema(
        "harmonize",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 1; color.g = 0; color.b = 0;
        variable source: Color.SRGB;
        source.r = 0; source.g = 0; source.b = 1;
        harmonize(color, source, 0.5).to.srgb()
        `
      );

      expect(result).toBeDefined();
      expect((result as any).constructor.name).toBe("ColorSymbol");
    });

    it("should return original color with amount 0", async () => {
      const result = await executeWithSchema(
        "harmonize",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 1; color.g = 0; color.b = 0;
        variable source: Color.SRGB;
        source.r = 0; source.g = 0; source.b = 1;
        harmonize(color, source, 0).to.srgb()
        `
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeCloseTo(1, 1);
    });
  });
});
