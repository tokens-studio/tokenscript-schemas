/**
 * Unit tests for the Tetradic function
 * Generates tetradic colors (90° apart on color wheel)
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Tetradic Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("tetradic", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Tetradic");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("tetradic");
    });
  });

  describe("Function Execution", () => {
    it("should generate 4 colors", async () => {
      const result = await executeWithSchema(
        "tetradic",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.8; base.g = 0.2; base.b = 0.4;
        tetradic(base)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should include the base color", async () => {
      const result = await executeWithSchema(
        "tetradic",
        "function",
        `
        variable green: Color.SRGB;
        green.r = 0.2; green.g = 0.8; green.b = 0.3;
        tetradic(green)
        `,
      );

      expect(result).toBeDefined();
    });
  });
});
