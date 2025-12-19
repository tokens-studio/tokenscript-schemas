import { describe, expect, it } from "vitest";
import {
  executeWithSchema,
} from "@tests/helpers/schema-test-utils";

describe("Is Warm Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const { getBundledSchema } = await import("@tests/helpers/schema-test-utils");
      const schema = await getBundledSchema("is_warm", "function");

      expect(schema.name).toBe("Is Warm");
      expect(schema.type).toBe("function");
      expect((schema as any).keyword).toBe("is_warm");
    });
  });

  describe("Warm Colors", () => {
    it("should return true for red", async () => {
      const result = await executeWithSchema(
        "is_warm",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1; c.g = 0; c.b = 0;
        is_warm(c)
        `,
      );

      expect(result.value).toBe(true);
    });

    it("should return true for orange", async () => {
      const result = await executeWithSchema(
        "is_warm",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1; c.g = 0.5; c.b = 0;
        is_warm(c)
        `,
      );

      expect(result.value).toBe(true);
    });

    it("should return true for yellow", async () => {
      const result = await executeWithSchema(
        "is_warm",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1; c.g = 1; c.b = 0;
        is_warm(c)
        `,
      );

      expect(result.value).toBe(true);
    });
  });

  describe("Cool Colors", () => {
    it("should return false for blue", async () => {
      const result = await executeWithSchema(
        "is_warm",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0; c.g = 0; c.b = 1;
        is_warm(c)
        `,
      );

      expect(result.value).toBe(false);
    });

    it("should return false for green", async () => {
      const result = await executeWithSchema(
        "is_warm",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0; c.g = 1; c.b = 0;
        is_warm(c)
        `,
      );

      expect(result.value).toBe(false);
    });

    it("should return false for cyan", async () => {
      const result = await executeWithSchema(
        "is_warm",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0; c.g = 1; c.b = 1;
        is_warm(c)
        `,
      );

      expect(result.value).toBe(false);
    });

    it("should return false for purple", async () => {
      const result = await executeWithSchema(
        "is_warm",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0.5; c.g = 0; c.b = 1;
        is_warm(c)
        `,
      );

      expect(result.value).toBe(false);
    });
  });

  describe("Achromatic Colors", () => {
    it("should return false for white (neutral)", async () => {
      const result = await executeWithSchema(
        "is_warm",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1; c.g = 1; c.b = 1;
        is_warm(c)
        `,
      );

      expect(result.value).toBe(false);
    });

    it("should return false for black (neutral)", async () => {
      const result = await executeWithSchema(
        "is_warm",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0; c.g = 0; c.b = 0;
        is_warm(c)
        `,
      );

      expect(result.value).toBe(false);
    });

    it("should return false for gray (neutral)", async () => {
      const result = await executeWithSchema(
        "is_warm",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0.5; c.g = 0.5; c.b = 0.5;
        is_warm(c)
        `,
      );

      expect(result.value).toBe(false);
    });
  });
});

