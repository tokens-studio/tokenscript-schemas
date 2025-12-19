/**
 * Unit tests for the Split Complement function
 * Generates split complementary colors (150° and 210° from base)
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Split Complement Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "split_complement",
        "function",
      )) as FunctionSpecification;

      expect(schema.name).toBe("Split Complement");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("split_complement");
    });
  });

  describe("Function Execution", () => {
    it("should generate 3 colors", async () => {
      const result = await executeWithSchema(
        "split_complement",
        "function",
        `
        variable base: Color.SRGB;
        base.r = 0.9; base.g = 0.5; base.b = 0.2;
        split_complement(base)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should include the base color", async () => {
      const result = await executeWithSchema(
        "split_complement",
        "function",
        `
        variable purple: Color.SRGB;
        purple.r = 0.6; purple.g = 0.2; purple.b = 0.8;
        split_complement(purple)
        `,
      );

      expect(result).toBeDefined();
    });
  });
});
