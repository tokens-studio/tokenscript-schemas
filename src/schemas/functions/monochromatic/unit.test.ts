import { describe, expect, it } from "vitest";
import {
  executeWithSchema,
} from "@tests/helpers/schema-test-utils";

describe("Monochromatic Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const { getBundledSchema } = await import("@tests/helpers/schema-test-utils");
      const schema = await getBundledSchema("monochromatic", "function");

      expect(schema.name).toBe("Monochromatic");
      expect(schema.type).toBe("function");
      expect((schema as any).keyword).toBe("monochromatic");
    });
  });

  describe("Basic Generation", () => {
    it("should generate colors with default count", async () => {
      const result = await executeWithSchema(
        "monochromatic",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0.2; c.g = 0.4; c.b = 0.8;
        monochromatic(c)
        `,
      );

      expect(result).toBeDefined();
      expect(result.value).toBeDefined();
    });

    it("should generate colors with specified count", async () => {
      const result = await executeWithSchema(
        "monochromatic",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0.8; c.g = 0.2; c.b = 0.4;
        monochromatic(c, 7)
        `,
      );

      expect(result).toBeDefined();
      expect(result.value).toBeDefined();
    });
  });

  describe("Different Base Colors", () => {
    it("should work with red base", async () => {
      const result = await executeWithSchema(
        "monochromatic",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1; c.g = 0; c.b = 0;
        monochromatic(c, 5)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should work with blue base", async () => {
      const result = await executeWithSchema(
        "monochromatic",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0; c.g = 0; c.b = 1;
        monochromatic(c, 5)
        `,
      );

      expect(result).toBeDefined();
    });

    it("should work with green base", async () => {
      const result = await executeWithSchema(
        "monochromatic",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0; c.g = 0.8; c.b = 0.2;
        monochromatic(c, 5)
        `,
      );

      expect(result).toBeDefined();
    });
  });
});
