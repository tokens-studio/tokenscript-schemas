import { executeWithSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";

describe("Clamp to Gamut Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const { getBundledSchema } = await import("@tests/helpers/schema-test-utils");
      const schema = await getBundledSchema("clamp_to_gamut", "function");

      expect(schema.name).toBe("Clamp to Gamut");
      expect(schema.type).toBe("function");
      expect((schema as any).keyword).toBe("clamp_to_gamut");
    });
  });

  describe("In-Gamut Colors", () => {
    it("should not modify colors already in gamut", async () => {
      const result = await executeWithSchema(
        "clamp_to_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0.5; c.g = 0.3; c.b = 0.7;
        clamp_to_gamut(c)
        `,
      );

      expect(result.value.r.value).toBeCloseTo(0.5, 5);
      expect(result.value.g.value).toBeCloseTo(0.3, 5);
      expect(result.value.b.value).toBeCloseTo(0.7, 5);
    });

    it("should preserve black", async () => {
      const result = await executeWithSchema(
        "clamp_to_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0; c.g = 0; c.b = 0;
        clamp_to_gamut(c)
        `,
      );

      expect(result.value.r.value).toBe(0);
      expect(result.value.g.value).toBe(0);
      expect(result.value.b.value).toBe(0);
    });

    it("should preserve white", async () => {
      const result = await executeWithSchema(
        "clamp_to_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1; c.g = 1; c.b = 1;
        clamp_to_gamut(c)
        `,
      );

      expect(result.value.r.value).toBe(1);
      expect(result.value.g.value).toBe(1);
      expect(result.value.b.value).toBe(1);
    });
  });

  describe("Clamping Overflow Values", () => {
    it("should clamp R > 1 to 1", async () => {
      const result = await executeWithSchema(
        "clamp_to_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 1.5; c.g = 0.5; c.b = 0.5;
        clamp_to_gamut(c)
        `,
      );

      expect(result.value.r.value).toBe(1);
      expect(result.value.g.value).toBeCloseTo(0.5, 5);
      expect(result.value.b.value).toBeCloseTo(0.5, 5);
    });

    it("should clamp G > 1 to 1", async () => {
      const result = await executeWithSchema(
        "clamp_to_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0.5; c.g = 2.0; c.b = 0.5;
        clamp_to_gamut(c)
        `,
      );

      expect(result.value.r.value).toBeCloseTo(0.5, 5);
      expect(result.value.g.value).toBe(1);
      expect(result.value.b.value).toBeCloseTo(0.5, 5);
    });

    it("should clamp B > 1 to 1", async () => {
      const result = await executeWithSchema(
        "clamp_to_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0.5; c.g = 0.5; c.b = 1.3;
        clamp_to_gamut(c)
        `,
      );

      expect(result.value.r.value).toBeCloseTo(0.5, 5);
      expect(result.value.g.value).toBeCloseTo(0.5, 5);
      expect(result.value.b.value).toBe(1);
    });
  });

  describe("Clamping Underflow Values", () => {
    it("should clamp R < 0 to 0", async () => {
      const result = await executeWithSchema(
        "clamp_to_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = -0.5; c.g = 0.5; c.b = 0.5;
        clamp_to_gamut(c)
        `,
      );

      expect(result.value.r.value).toBe(0);
      expect(result.value.g.value).toBeCloseTo(0.5, 5);
      expect(result.value.b.value).toBeCloseTo(0.5, 5);
    });

    it("should clamp negative G to 0", async () => {
      const result = await executeWithSchema(
        "clamp_to_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = 0.5; c.g = -0.1; c.b = 0.5;
        clamp_to_gamut(c)
        `,
      );

      expect(result.value.r.value).toBeCloseTo(0.5, 5);
      expect(result.value.g.value).toBe(0);
      expect(result.value.b.value).toBeCloseTo(0.5, 5);
    });
  });

  describe("Multiple Channel Clamping", () => {
    it("should clamp all channels that are out of range", async () => {
      const result = await executeWithSchema(
        "clamp_to_gamut",
        "function",
        `
        variable c: Color.SRGB;
        c.r = -0.2; c.g = 1.5; c.b = 2.0;
        clamp_to_gamut(c)
        `,
      );

      expect(result.value.r.value).toBe(0);
      expect(result.value.g.value).toBe(1);
      expect(result.value.b.value).toBe(1);
    });
  });
});
