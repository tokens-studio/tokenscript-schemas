/**
 * Unit tests for the Hover State function
 * Generates a hover state color variation
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Hover State Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("hover_state", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Hover State");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("hover_state");
    });
  });

  describe("Function Execution", () => {
    it("should lighten a dark button", async () => {
      const result = await executeWithSchema(
        "hover_state",
        "function",
        `
        variable button: Color.SRGB;
        button.r = 0.2; button.g = 0.4; button.b = 0.8;
        hover_state(button)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // Hover on dark should be lighter
      expect(r + g + b).toBeGreaterThan(0.2 + 0.4 + 0.8);
    });

    it("should darken a light button", async () => {
      const result = await executeWithSchema(
        "hover_state",
        "function",
        `
        variable button: Color.SRGB;
        button.r = 0.9; button.g = 0.85; button.b = 0.8;
        hover_state(button)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // Hover on light should be darker
      expect(r + g + b).toBeLessThan(0.9 + 0.85 + 0.8);
    });
  });
});

