/**
 * Unit tests for the Analogous function
 * Generates analogous colors (adjacent hues)
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Analogous Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("analogous", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Analogous");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("analogous");
    });
  });

  describe("Function Execution", () => {
    it("should generate 5 colors by default", async () => {
      const result = await executeWithSchema(
        "analogous",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.8; base.g = 0.3; base.b = 0.3;
        analogous(base)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should generate specified number of colors", async () => {
      const result = await executeWithSchema(
        "analogous",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.3; base.g = 0.6; base.b = 0.9;
        analogous(base, 3)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should use custom spread angle", async () => {
      const result = await executeWithSchema(
        "analogous",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.5; base.g = 0.8; base.b = 0.3;
        analogous(base, 5, 30)
        `,
      );

      expect(result).toBeDefined();
    });
  });
});
