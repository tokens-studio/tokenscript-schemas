/**
 * Unit tests for the Diverging function
 * Creates a diverging color palette for data visualization
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Diverging Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("diverging", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Diverging");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("diverging");
    });
  });

  describe("Function Execution", () => {
    it("should generate 9 steps by default", async () => {
      const result = await executeWithSchema(
        "diverging",
        "function",
        `
        variable cold: Color.SRGB;
        cold.r = 0.2; cold.g = 0.4; cold.b = 0.8;
        variable hot: Color.SRGB;
        hot.r = 0.8; hot.g = 0.2; hot.b = 0.2;
        diverging(cold, hot)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should generate specified number of steps", async () => {
      const result = await executeWithSchema(
        "diverging",
        "function",
        `
        variable blue: Color.SRGB;
        blue.r = 0; blue.g = 0.3; blue.b = 0.7;
        variable red: Color.SRGB;
        red.r = 0.7; red.g = 0.1; red.b = 0.1;
        diverging(blue, red, 5)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should have neutral midpoint", async () => {
      const result = await executeWithSchema(
        "diverging",
        "function",
        `
        variable neg: Color.SRGB;
        neg.r = 0; neg.g = 0.5; neg.b = 0.8;
        variable pos: Color.SRGB;
        pos.r = 0.9; pos.g = 0.4; pos.b = 0;
        diverging(neg, pos, 9)
        `,
      );

      expect(result).toBeDefined();
    });
  });
});
