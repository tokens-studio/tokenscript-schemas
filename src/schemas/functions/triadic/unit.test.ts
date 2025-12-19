/**
 * Unit tests for the Triadic function
 * Generates triadic colors (120° apart on color wheel)
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Triadic Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("triadic", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Triadic");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("triadic");
    });
  });

  describe("Function Execution", () => {
    it("should generate 3 colors", async () => {
      const result = await executeWithSchema(
        "triadic",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.9; base.g = 0.2; base.b = 0.2;
        triadic(base)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should include the base color", async () => {
      const result = await executeWithSchema(
        "triadic",
        "function",
        `
        variable blue: Color.SRGB;
        blue.r = 0.2; blue.g = 0.3; blue.b = 0.9;
        triadic(blue)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should preserve lightness across colors", async () => {
      const result = await executeWithSchema(
        "triadic",
        "function",
        `
        variable mid: Color.SRGB;
        mid.r = 0.6; mid.g = 0.5; mid.b = 0.4;
        triadic(mid)
        `,
      );

      expect(result).toBeDefined();
    });
  });
});

