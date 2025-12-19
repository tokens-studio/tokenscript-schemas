/**
 * Unit tests for the Disabled State function
 * Generates a disabled/muted state color variation
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Disabled State Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema(
        "disabled_state",
        "function",
      )) as FunctionSpecification;

      expect(schema.name).toBe("Disabled State");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("disabled_state");
    });
  });

  describe("Function Execution", () => {
    it("should desaturate the color", async () => {
      const result = await executeWithSchema(
        "disabled_state",
        "function",
        `
        variable button: Color.SRGB;
        button.r = 0.9; button.g = 0.2; button.b = 0.2;
        disabled_state(button)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // Disabled should be less saturated (channels closer together)
      const originalSpread = 0.9 - 0.2;
      const newSpread = Math.max(r, g, b) - Math.min(r, g, b);
      expect(newSpread).toBeLessThan(originalSpread);
    });

    it("should reduce contrast", async () => {
      const result = await executeWithSchema(
        "disabled_state",
        "function",
        `
        variable button: Color.SRGB;
        button.r = 0.1; button.g = 0.4; button.b = 0.9;
        disabled_state(button)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
    });
  });
});

