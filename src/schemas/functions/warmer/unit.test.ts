/**
 * Unit tests for the warmer function
 * Shifts hue towards warm colors
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("warmer function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("warmer", "function")) as FunctionSpecification;

      expect(schema.name).toBe("warmer");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should shift blue towards warm (purple)", async () => {
      const result = await executeWithSchema(
        "warmer",
        "function",
        `
        variable blue: Color.SRGB;
        blue.r = 0; blue.g = 0; blue.b = 1;
        warmer(blue, 0.5).to.srgb()
        `,
      );

      expect(result).toBeDefined();
      // Blue shifted warm should have more red
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeGreaterThan(0.1);
    });

    it("should shift green towards warm (yellow)", async () => {
      const result = await executeWithSchema(
        "warmer",
        "function",
        `
        variable green: Color.SRGB;
        green.r = 0; green.g = 1; green.b = 0;
        warmer(green, 0.5).to.srgb()
        `,
      );

      expect(result).toBeDefined();
      // Green shifted warm should have more red
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      expect(r).toBeGreaterThan(0.1);
    });

    it("should use default amount if not provided", async () => {
      const result = await executeWithSchema(
        "warmer",
        "function",
        `
        variable blue: Color.SRGB;
        blue.r = 0; blue.g = 0; blue.b = 1;
        warmer(blue).to.srgb()
        `,
      );

      expect(result).toBeDefined();
    });
  });
});
