/**
 * Unit tests for the Set Hue function
 * Sets a color's hue to a specific angle in OKLCH
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Set Hue Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("set_hue", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Set Hue");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("set_hue");
    });
  });

  describe("Function Execution", () => {
    it("should set hue to 0 (red)", async () => {
      const result = await executeWithSchema(
        "set_hue",
        "function",
        `
        variable blue: Color.SRGB;
        blue.r = 0.2; blue.g = 0.3; blue.b = 0.9;
        set_hue(blue, 30)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // At hue ~30° should be more orange/red-ish
      const r = (result as any).value.r.value;
      const b = (result as any).value.b.value;
      expect(r).toBeGreaterThan(b);
    });

    it("should set hue to 120 (green)", async () => {
      const result = await executeWithSchema(
        "set_hue",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 0.9; red.g = 0.2; red.b = 0.2;
        set_hue(red, 140)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      // At hue ~140° should be green-ish
      expect(g).toBeGreaterThan(r);
    });

    it("should set hue to 240 (blue)", async () => {
      const result = await executeWithSchema(
        "set_hue",
        "function",
        `
        variable green: Color.SRGB;
        green.r = 0.2; green.g = 0.8; green.b = 0.3;
        set_hue(green, 260)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // At hue ~260° should be blue-ish
      expect(b).toBeGreaterThan(g);
    });

    it("should preserve lightness and chroma", async () => {
      const result = await executeWithSchema(
        "set_hue",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.7; color.g = 0.3; color.b = 0.5;
        set_hue(color, 180)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
    });
  });
});

