import { executeWithSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";

describe("Is Cool Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const { getBundledSchema } = await import("@tests/helpers/schema-test-utils");
      const schema = await getBundledSchema("is_cool", "function");

      expect(schema.name).toBe("Is Cool");
      expect(schema.type).toBe("function");
      expect((schema as any).keyword).toBe("is_cool");
    });
  });

  describe("Cool Colors", () => {
    it("should return true for blue", async () => {
      const result = await executeWithSchema(
        "is_cool",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0; c.g = 0; c.b = 1;
        is_cool(c)
        `,
      );

      expect(result.value).toBe(true);
    });

    it("should return true for green", async () => {
      const result = await executeWithSchema(
        "is_cool",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0; c.g = 1; c.b = 0;
        is_cool(c)
        `,
      );

      expect(result.value).toBe(true);
    });

    it("should return true for cyan", async () => {
      const result = await executeWithSchema(
        "is_cool",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0; c.g = 1; c.b = 1;
        is_cool(c)
        `,
      );

      expect(result.value).toBe(true);
    });

    it("should return true for purple", async () => {
      const result = await executeWithSchema(
        "is_cool",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0.5; c.g = 0; c.b = 1;
        is_cool(c)
        `,
      );

      expect(result.value).toBe(true);
    });
  });

  describe("Warm Colors", () => {
    it("should return false for red", async () => {
      const result = await executeWithSchema(
        "is_cool",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1; c.g = 0; c.b = 0;
        is_cool(c)
        `,
      );

      expect(result.value).toBe(false);
    });

    it("should return false for orange", async () => {
      const result = await executeWithSchema(
        "is_cool",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1; c.g = 0.5; c.b = 0;
        is_cool(c)
        `,
      );

      expect(result.value).toBe(false);
    });

    it("should return false for yellow", async () => {
      const result = await executeWithSchema(
        "is_cool",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1; c.g = 1; c.b = 0;
        is_cool(c)
        `,
      );

      expect(result.value).toBe(false);
    });
  });

  describe("Achromatic Colors", () => {
    it("should return true for white (neutral treated as cool)", async () => {
      const result = await executeWithSchema(
        "is_cool",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1; c.g = 1; c.b = 1;
        is_cool(c)
        `,
      );

      expect(result.value).toBe(true);
    });

    it("should return true for black (neutral treated as cool)", async () => {
      const result = await executeWithSchema(
        "is_cool",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0; c.g = 0; c.b = 0;
        is_cool(c)
        `,
      );

      expect(result.value).toBe(true);
    });

    it("should return true for gray (neutral treated as cool)", async () => {
      const result = await executeWithSchema(
        "is_cool",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0.5; c.g = 0.5; c.b = 0.5;
        is_cool(c)
        `,
      );

      expect(result.value).toBe(true);
    });
  });

  describe("Complementary to is_warm", () => {
    it("is_cool and is_warm should be mutually exclusive for chromatic colors", async () => {
      // Blue is cool, not warm
      const coolResult = await executeWithSchema(
        "is_cool",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0; c.g = 0; c.b = 1;
        is_cool(c)
        `,
      );

      const warmResult = await executeWithSchema(
        "is_warm",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0; c.g = 0; c.b = 1;
        is_warm(c)
        `,
      );

      expect(coolResult.value).toBe(true);
      expect(warmResult.value).toBe(false);
    });
  });
});
