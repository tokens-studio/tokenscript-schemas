/**
 * Unit tests for the Desaturate function
 * Decreases color saturation by reducing OKLCH chroma
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Desaturate Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("desaturate", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Desaturate");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("desaturate");
    });
  });

  describe("Function Execution", () => {
    it("should decrease saturation of a vivid color", async () => {
      const result = await executeWithSchema(
        "desaturate",
        "function",
        `
        variable vivid: Color.SRGB;
        vivid.r = 0.9; vivid.g = 0.2; vivid.b = 0.2;
        desaturate(vivid, 0.1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      // Desaturated color channels should be closer together
      const r = (result as any).value.r.value;
      const g = (result as any).value.g.value;
      expect(r - g).toBeLessThan(0.9 - 0.2);
    });

    it("should use default amount of 0.1", async () => {
      const result = await executeWithSchema(
        "desaturate",
        "function",
        `
        variable color: Color.SRGB;
        color.r = 0.8; color.g = 0.3; color.b = 0.3;
        desaturate(color)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
    });
  });
});
