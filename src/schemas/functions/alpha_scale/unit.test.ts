/**
 * Unit tests for the Alpha Scale function
 * Generates an alpha transparency scale
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Alpha Scale Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("alpha_scale", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Alpha Scale");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("alpha_scale");
    });
  });

  describe("Function Execution", () => {
    it("should generate alpha scale", async () => {
      const result = await executeWithSchema(
        "alpha_scale",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.2; base.g = 0.4; base.b = 0.8;
        alpha_scale(base)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should generate specified number of steps", async () => {
      const result = await executeWithSchema(
        "alpha_scale",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.9; base.g = 0.2; base.b = 0.3;
        alpha_scale(base, 5)
        `,
      );

      expect(result).toBeDefined();
    });
  });
});
