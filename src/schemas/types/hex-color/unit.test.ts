import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

describe("Hex Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have valid schema structure", async () => {
      const schema = (await getBundledSchema("hex-color")) as ColorSpecification;

      expect(schema.name).toBe("Hex");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.type).toBe("object");
      expect(schema.schema?.properties.value).toBeDefined();
      expect(schema.schema?.properties.value.type).toBe("string");
    });

    it("should have hex initializer", async () => {
      const schema = (await getBundledSchema("hex-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("hex");
      expect(schema.initializers[0].script.script).toContain("Color.Hex");
    });
  });

  describe("Initialization", () => {
    it("should create hex color from string", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable c: Color.Hex = #ff0000;
        return c;
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Hex");
      expect((result as any).value).toBe("#ff0000");
    });

    it("should create hex color with 6 digits", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable c: Color.Hex = #abcdef;
        return c;
      `,
      );

      expect((result as any).value).toBe("#abcdef");
    });

    it("should create hex color with 3 digits", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable c: Color.Hex = #abc;
        return c;
      `,
      );

      expect((result as any).value).toBe("#abc");
    });
  });

  describe("Edge Cases", () => {
    it("should handle lowercase hex", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable c: Color.Hex = #ffffff;
        return c;
      `,
      );

      expect((result as any).value).toBe("#ffffff");
    });

    it("should handle uppercase hex", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable c: Color.Hex = #FFFFFF;
        return c;
      `,
      );

      expect((result as any).value).toBe("#FFFFFF");
    });

    it("should handle black color", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable c: Color.Hex = #000000;
        return c;
      `,
      );

      expect((result as any).value).toBe("#000000");
    });

    it("should handle white color", async () => {
      const result = await executeWithSchema(
        "hex-color",
        "type",
        `
        variable c: Color.Hex = #ffffff;
        return c;
      `,
      );

      expect((result as any).value).toBe("#ffffff");
    });
  });
});
