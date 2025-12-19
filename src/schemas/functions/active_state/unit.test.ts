/**
 * Unit tests for the Active State function
 * Generates an active/pressed state color variation
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Active State Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("active_state", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Active State");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("active_state");
    });
  });

  describe("Function Execution", () => {
    it("should generate active state", async () => {
      const result = await executeWithSchema(
        "active_state",
        "function",
        `
        variable button: Color.SRGB;
        button.r = 0.2; button.g = 0.5; button.b = 0.9;
        active_state(button)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
    });

    it("should be different from base color", async () => {
      const result = await executeWithSchema(
        "active_state",
        "function",
        `
        variable button: Color.SRGB;
        button.r = 0.6; button.g = 0.3; button.b = 0.8;
        active_state(button)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      const r = (result as any).value.r.value;
      // Should be noticeably different
      expect(Math.abs(r - 0.6)).toBeGreaterThan(0.01);
    });
  });
});

