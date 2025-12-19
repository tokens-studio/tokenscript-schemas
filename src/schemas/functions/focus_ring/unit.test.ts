/**
 * Unit tests for the Focus Ring function
 * Generates an accessible focus ring color
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Focus Ring Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("focus_ring", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Focus Ring");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("focus_ring");
    });
  });

  describe("Function Execution", () => {
    it("should generate focus ring color", async () => {
      const result = await executeWithSchema(
        "focus_ring",
        "function",
        `
        variable button: Color.SRGB;
        button.r = 0.2; button.g = 0.5; button.b = 0.9;
        focus_ring(button)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
    });

    it("should be visually distinct from base", async () => {
      const result = await executeWithSchema(
        "focus_ring",
        "function",
        `
        variable element: Color.SRGB;
        element.r = 0.5; element.g = 0.5; element.b = 0.5;
        focus_ring(element)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      const b = (result as any).value.b.value;
      // Focus ring should be noticeably different
      const avgDiff = Math.abs(r - 0.5) + Math.abs(g - 0.5) + Math.abs(b - 0.5);
      expect(avgDiff).toBeGreaterThan(0.1);
    });
  });
});

