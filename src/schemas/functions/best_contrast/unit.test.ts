/**
 * Unit tests for the Best Contrast function
 * Selects the most contrasting color from candidates against a background
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Best Contrast Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("best_contrast", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Best Contrast");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("best_contrast");
    });
  });

  describe("Function Execution", () => {
    it("should return white on dark background (default candidates)", async () => {
      const result = await executeWithSchema(
        "best_contrast",
        "function",
        `
        variable dark: Color.SRGB;
        dark.r = 0.1; dark.g = 0.1; dark.b = 0.2;
        best_contrast(dark)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // Should be white (high values)
      expect(r).toBeGreaterThan(0.9);
      expect(g).toBeGreaterThan(0.9);
      expect(b).toBeGreaterThan(0.9);
    });

    it("should return black on light background (default candidates)", async () => {
      const result = await executeWithSchema(
        "best_contrast",
        "function",
        `
        variable light: Color.SRGB;
        light.r = 0.95; light.g = 0.95; light.b = 0.9;
        best_contrast(light)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // Should be black (low values)
      expect(r).toBeLessThan(0.1);
      expect(g).toBeLessThan(0.1);
      expect(b).toBeLessThan(0.1);
    });
  });
});

