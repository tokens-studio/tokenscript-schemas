import { describe, expect, it } from "vitest";
import {
  executeWithSchema,
} from "@tests/helpers/schema-test-utils";

describe("In Gamut Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const { getBundledSchema } = await import("@tests/helpers/schema-test-utils");
      const schema = await getBundledSchema("in_gamut", "function");

      expect(schema.name).toBe("In Gamut");
      expect(schema.type).toBe("function");
      expect((schema as any).keyword).toBe("in_gamut");
    });
  });

  describe("Basic Checks", () => {
    it("should return true for black (0,0,0)", async () => {
      const result = await executeWithSchema(
        "in_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0; c.g = 0; c.b = 0;
        in_gamut(c)
        `,
      );

      expect(result.value).toBe(true);
    });

    it("should return true for white (1,1,1)", async () => {
      const result = await executeWithSchema(
        "in_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1; c.g = 1; c.b = 1;
        in_gamut(c)
        `,
      );

      expect(result.value).toBe(true);
    });

    it("should return true for mid-gray (0.5,0.5,0.5)", async () => {
      const result = await executeWithSchema(
        "in_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0.5; c.g = 0.5; c.b = 0.5;
        in_gamut(c)
        `,
      );

      expect(result.value).toBe(true);
    });

    it("should return true for primary red (1,0,0)", async () => {
      const result = await executeWithSchema(
        "in_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1; c.g = 0; c.b = 0;
        in_gamut(c)
        `,
      );

      expect(result.value).toBe(true);
    });
  });

  describe("Out of Gamut Detection", () => {
    it("should return false for negative R", async () => {
      const result = await executeWithSchema(
        "in_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = -0.1; c.g = 0.5; c.b = 0.5;
        in_gamut(c)
        `,
      );

      expect(result.value).toBe(false);
    });

    it("should return false for R > 1", async () => {
      const result = await executeWithSchema(
        "in_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1.1; c.g = 0.5; c.b = 0.5;
        in_gamut(c)
        `,
      );

      expect(result.value).toBe(false);
    });

    it("should return false for negative G", async () => {
      const result = await executeWithSchema(
        "in_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0.5; c.g = -0.05; c.b = 0.5;
        in_gamut(c)
        `,
      );

      expect(result.value).toBe(false);
    });

    it("should return false for B > 1", async () => {
      const result = await executeWithSchema(
        "in_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0.5; c.g = 0.5; c.b = 1.2;
        in_gamut(c)
        `,
      );

      expect(result.value).toBe(false);
    });
  });

  describe("Epsilon Tolerance", () => {
    it("should return true for values just within epsilon", async () => {
      // Default epsilon is 0.000075
      const result = await executeWithSchema(
        "in_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1.00005; c.g = 0.5; c.b = 0.5;
        in_gamut(c)
        `,
      );

      expect(result.value).toBe(true);
    });

    it("should return false for values outside epsilon", async () => {
      const result = await executeWithSchema(
        "in_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1.001; c.g = 0.5; c.b = 0.5;
        in_gamut(c)
        `,
      );

      expect(result.value).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle exact boundary values", async () => {
      const result = await executeWithSchema(
        "in_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0; c.g = 1; c.b = 0;
        in_gamut(c)
        `,
      );

      expect(result.value).toBe(true);
    });
  });
});

