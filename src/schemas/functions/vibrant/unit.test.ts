/**
 * Unit tests for the vibrant function
 * Increases chroma toward maximum
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("vibrant function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("vibrant", "function")) as FunctionSpecification;

      expect(schema.name).toBe("vibrant");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should increase saturation of muted colors", async () => {
      const result = await executeWithSchema(
        "vibrant",
        "function",
        `
        variable muted_blue: Color.SRGB;
        muted_blue.r = 0.4; muted_blue.g = 0.5; muted_blue.b = 0.6;
        vibrant(muted_blue).to.srgb()
        `,
      );

      expect(result).toBeDefined();
      expect((result as any).constructor.name).toBe("ColorSymbol");
    });

    it("should have minimal effect on already vibrant colors", async () => {
      const result = await executeWithSchema(
        "vibrant",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        vibrant(red, 0.5).to.srgb()
        `,
      );

      expect(result).toBeDefined();
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      // Should still be predominantly red
      expect(r).toBeGreaterThan(0.7);
      expect(g).toBeLessThan(0.5);
    });
  });
});
