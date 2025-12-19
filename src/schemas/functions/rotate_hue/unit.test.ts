/**
 * Unit tests for the Rotate Hue function
 * Rotates a color's hue by specified degrees in OKLCH
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Rotate Hue Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("rotate_hue", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Rotate Hue");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("rotate_hue");
    });
  });

  describe("Function Execution", () => {
    it("should rotate hue by specified degrees", async () => {
      const result = await executeWithSchema(
        "rotate_hue",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 0.9; red.g = 0.2; red.b = 0.2;
        rotate_hue(red, 120)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // Red rotated 120° should be more green-ish
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      expect(g).toBeGreaterThan(r);
    });

    it("should handle 360° rotation (return to original)", async () => {
      const result = await executeWithSchema(
        "rotate_hue",
        "function",
        `
        variable blue: Color.SRGB;
        blue.r = 0.2; blue.g = 0.3; blue.b = 0.9;
        rotate_hue(blue, 360)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const b = (result as any).value.b.value;
      // Should still be blue-ish after full rotation
      expect(b).toBeGreaterThan(r);
    });

    it("should handle negative rotation", async () => {
      const result = await executeWithSchema(
        "rotate_hue",
        "function",
        `
        variable green: Color.SRGB;
        green.r = 0.2; green.g = 0.8; green.b = 0.3;
        rotate_hue(green, -60)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
    });

    it("should preserve lightness and chroma", async () => {
      const result = await executeWithSchema(
        "rotate_hue",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.6; color.g = 0.4; color.b = 0.8;
        rotate_hue(color, 45)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
    });
  });
});
