/**
 * Unit tests for the clamp_chroma function
 * Constrains chroma to a range
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("clamp_chroma function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("clamp_chroma", "function")) as FunctionSpecification;

      expect(schema.name).toBe("clamp_chroma");
      expect(schema.type).toBe("function");
    });
  });

  describe("Function Execution", () => {
    it("should clamp saturated color to maximum", async () => {
      const result = await executeWithSchema(
        "clamp_chroma",
        "function",
        `
        variable red: Color.SRGB;
        red.r = 1; red.g = 0; red.b = 0;
        clamp_chroma(red, 0, 0.1).to.srgb()
        `,
      );

      expect(result).toBeDefined();
      // Result should be less saturated
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      // Less extreme difference between channels
      expect(r - g).toBeLessThan(0.8);
    });

    it("should preserve already-low-chroma colors", async () => {
      const result = await executeWithSchema(
        "clamp_chroma",
        "function",
        `
        variable gray: Color.SRGB;
        gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
        clamp_chroma(gray, 0, 0.3).to.srgb()
        `,
      );

      expect(result).toBeDefined();
      // Gray should remain gray
      const r = (result as any).value?.r?.value ?? (result as any).value?.r;
      const g = (result as any).value?.g?.value ?? (result as any).value?.g;
      const b = (result as any).value?.b?.value ?? (result as any).value?.b;
      expect(Math.abs(r - g)).toBeLessThan(0.1);
      expect(Math.abs(g - b)).toBeLessThan(0.1);
    });
  });
});
