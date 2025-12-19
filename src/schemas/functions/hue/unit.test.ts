/**
 * Unit tests for the hue function
 * Extracts hue angle from a color
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("hue function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "hue",
        "function"
      )) as FunctionSpecification;

      expect(schema.name).toBe("hue");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should return hue for red (~30° in OKLCH)", async () => {
      const result = await executeWithSchema(
        "hue",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        hue(red)
        `
      );

      expect(result).toBeDefined();
      const h = (result as any).value ?? result;
      // Red in OKLCH has hue around 29-30°
      expect(h).toBeGreaterThan(20);
      expect(h).toBeLessThan(40);
    });

    it("should return hue for green (~142° in OKLCH)", async () => {
      const result = await executeWithSchema(
        "hue",
        "function",
        `
        variable green: Color.SRGB;
        green.r = 0; green.g = 1; green.b = 0;
        hue(green)
        `
      );

      expect(result).toBeDefined();
      const h = (result as any).value ?? result;
      // Green in OKLCH has hue around 142°
      expect(h).toBeGreaterThan(130);
      expect(h).toBeLessThan(160);
    });

    it("should return hue for blue (~264° in OKLCH)", async () => {
      const result = await executeWithSchema(
        "hue",
        "function",
        `
        variable blue: Color.SRGB;
        blue.r = 0; blue.g = 0; blue.b = 1;
        hue(blue)
        `
      );

      expect(result).toBeDefined();
      const h = (result as any).value ?? result;
      // Blue in OKLCH has hue around 264°
      expect(h).toBeGreaterThan(250);
      expect(h).toBeLessThan(280);
    });
  });
});
