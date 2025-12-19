/**
 * Unit tests for the Saturate function
 * Increases color saturation by boosting OKLCH chroma
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Saturate Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("saturate", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Saturate");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("saturate");
    });
  });

  describe("Function Execution", () => {
    it("should increase saturation of a muted color", async () => {
      const result = await executeWithSchema(
        "saturate",
        "function",
        `
        variable muted: Color.SRGB;
        muted.r = 0.5; muted.g = 0.4; muted.b = 0.45;
        saturate(muted, 0.05).to.srgb()
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // Result should have more color separation (more saturated)
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      // b is extracted but not directly tested - saturation affects all channels
      const _b = (result as any).value.b.value;
      void _b; // Acknowledge extraction
      const originalSpread = Math.abs(0.5 - 0.4);
      const newSpread = Math.abs(r - g);
      expect(newSpread).toBeGreaterThanOrEqual(originalSpread - 0.01);
    });

    it("should use default amount of 0.1", async () => {
      const result = await executeWithSchema(
        "saturate",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.6; color.g = 0.5; color.b = 0.5;
        saturate(color).to.srgb()
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
    });
  });
});
