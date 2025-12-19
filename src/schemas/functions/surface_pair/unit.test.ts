/**
 * Unit tests for the Surface Pair function
 * Generates a background and contrasting text color
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Surface Pair Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("surface_pair", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Surface Pair");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("surface_pair");
    });
  });

  describe("Function Execution", () => {
    it("should generate surface and text color", async () => {
      const result = await executeWithSchema(
        "surface_pair",
        "function",
        `
        variable brand: Color.SRGB;
        brand.r = 0.2; brand.g = 0.4; brand.b = 0.8;
        surface_pair(brand)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should work with dark colors", async () => {
      const result = await executeWithSchema(
        "surface_pair",
        "function",
        `
        variable dark: Color.SRGB;
        dark.r = 0.1; dark.g = 0.1; dark.b = 0.15;
        surface_pair(dark)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should work with light colors", async () => {
      const result = await executeWithSchema(
        "surface_pair",
        "function",
        `
        variable light: Color.SRGB;
        light.r = 0.95; light.g = 0.9; light.b = 0.85;
        surface_pair(light)
        `,
      );

      expect(result).toBeDefined();
    });
  });
});

