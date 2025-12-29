import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

describe("RGB Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("rgb-color")) as ColorSpecification;

      expect(schema.name).toBe("Rgb");
      expect(schema.type).toBe("color");
      expect(schema.description).toBe("RGB color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("r");
      expect(schema.schema?.properties).toHaveProperty("g");
      expect(schema.schema?.properties).toHaveProperty("b");
      expect(schema.schema?.required).toEqual(["r", "g", "b"]);
    });

    it("should have initializers defined", async () => {
      const schema = (await getBundledSchema("rgb-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(2);
      expect(schema.initializers[0].keyword).toBe("rgb");
      expect(schema.initializers[0].script.script).toBeTruthy();
      expect(schema.initializers[0].script.script).not.toContain("./");
      expect(schema.initializers[1].keyword).toBe("rgba");
      expect(schema.initializers[1].script.script).toBeTruthy();
      expect(schema.initializers[1].script.script).not.toContain("./");
    });

    it("should have conversions defined", async () => {
      const schema = (await getBundledSchema("rgb-color")) as ColorSpecification;

      expect(schema.conversions).toHaveLength(2);

      // Check HEX to RGB conversion
      const hexToRgb = schema.conversions.find(
        (c: { target: string; source: string }) =>
          c.target === "$self" && c.source.includes("hex-color"),
      );
      expect(hexToRgb).toBeDefined();
      expect(hexToRgb?.lossless).toBe(true);
      expect(hexToRgb?.script.script).toBeTruthy();
      expect(hexToRgb?.script.script).not.toContain("./");

      // Check RGB to HEX conversion
      const rgbToHex = schema.conversions.find(
        (c: { target: string; source: string }) =>
          c.source === "$self" && c.target.includes("hex-color"),
      );
      expect(rgbToHex).toBeDefined();
      expect(rgbToHex?.lossless).toBe(true);
      expect(rgbToHex?.script.script).toBeTruthy();
      expect(rgbToHex?.script.script).not.toContain("./");
    });
  });

  describe("Initialization", () => {
    it("should initialize RGB color from object", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Rgb;
        c.r = 255;
        c.g = 128;
        c.b = 64;
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(128);
      expect((result as any).value.b.value).toBe(64);
    });

    it("should access individual color channels", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Rgb;
        c.r = 200;
        c.g = 150;
        c.b = 100;
        c.r
      `,
      );

      expect(result?.constructor.name).toBe("NumberSymbol");
      expect(result?.toString()).toBe("200");
    });
  });

  describe("Conversion from HEX to RGB", () => {
    it("should convert 6-digit HEX to RGB", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Hex = #ff5733;
        c.to.rgb()
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(87);
      expect((result as any).value.b.value).toBe(51);
    });

    it("should convert 3-digit HEX to RGB", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Hex = #f53;
        c.to.rgb()
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(85);
      expect((result as any).value.b.value).toBe(51);
    });

    it("should convert black HEX to RGB", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Hex = #000;
        c.to.rgb()
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(0);
      expect((result as any).value.g.value).toBe(0);
      expect((result as any).value.b.value).toBe(0);
    });

    it("should convert white HEX to RGB", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Hex = #ffffff;
        c.to.rgb()
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(255);
      expect((result as any).value.b.value).toBe(255);
    });
  });

  describe("Conversion from RGB to HEX", () => {
    it("should convert RGB to HEX", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Rgb;
        c.r = 255;
        c.g = 87;
        c.b = 51;
        c.to.hex()
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Hex");
      expect(result?.toString()).toBe("#ff5733");
    });

    it("should convert RGB with low values to HEX", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Rgb;
        c.r = 10;
        c.g = 5;
        c.b = 0;
        c.to.hex()
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Hex");
      expect(result?.toString()).toBe("#0a0500");
    });

    it("should convert black RGB to HEX", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Rgb;
        c.r = 0;
        c.g = 0;
        c.b = 0;
        c.to.hex()
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Hex");
      expect(result?.toString()).toBe("#000000");
    });

    it("should convert white RGB to HEX", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Rgb;
        c.r = 255;
        c.g = 255;
        c.b = 255;
        c.to.hex()
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Hex");
      expect(result?.toString()).toBe("#ffffff");
    });
  });

  describe("Round-trip Conversions", () => {
    it("should maintain color values through HEX -> RGB -> HEX", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable original: Color.Hex = #3498db;
        variable rgb: Color.Rgb = original.to.rgb();
        variable back: Color.Hex = rgb.to.hex();
        back
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Hex");
      expect(result?.toString()).toBe("#3498db");
    });

    it("should maintain color values through RGB -> HEX -> RGB", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable original: Color.Rgb;
        original.r = 52;
        original.g = 152;
        original.b = 219;
        
        variable hex: Color.Hex = original.to.hex();
        variable back: Color.Rgb = hex.to.rgb();
        back
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(52);
      expect((result as any).value.g.value).toBe(152);
      expect((result as any).value.b.value).toBe(219);
    });
  });

  describe("Identity Conversions", () => {
    it("should handle RGB to RGB identity conversion", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Rgb;
        c.r = 100;
        c.g = 150;
        c.b = 200;
        c.to.rgb()
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(100);
      expect((result as any).value.g.value).toBe(150);
      expect((result as any).value.b.value).toBe(200);
    });
  });

  describe("Alpha Channel Support", () => {
    it("should accept optional 4th parameter for alpha using rgb()", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Rgb = rgb(255, 128, 64, 0.5);
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(128);
      expect((result as any).value.b.value).toBe(64);
      expect((result as any).alpha).toBe(0.5);
    });

    it("should create color with rgba() initializer", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Rgb = rgba(200, 100, 50, 0.75);
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(200);
      expect((result as any).value.g.value).toBe(100);
      expect((result as any).value.b.value).toBe(50);
      expect((result as any).alpha).toBe(0.75);
    });

    it("should get alpha property", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Rgb = rgb(255, 0, 0, 0.3);
        c.alpha
      `,
      );

      expect((result as any).value).toBe(0.3);
    });

    it("should set alpha property", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Rgb = rgb(255, 0, 0);
        c.alpha = 0.9;
        c.alpha
      `,
      );

      expect((result as any).value).toBe(0.9);
    });

    it("should handle alpha = 0 (fully transparent)", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Rgb = rgb(255, 0, 0, 0);
        c.alpha
      `,
      );

      expect((result as any).value).toBe(0);
    });

    it("should handle alpha = 1 (fully opaque)", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Rgb = rgb(255, 0, 0, 1);
        c.alpha
      `,
      );

      expect((result as any).value).toBe(1);
    });

    it("should preserve alpha through HEX conversion", async () => {
      const result = await executeWithSchema(
        "rgb-color",
        "type",
        `
        variable c: Color.Rgb = rgb(255, 0, 0, 0.5);
        variable hex: Color.Hex = c.to.hex();
        variable back: Color.Rgb = hex.to.rgb();
        back.alpha
      `,
      );

      expect((result as any).value).toBe(0.5);
    });
  });
});
