import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

describe("RGBA Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("rgba-color")) as ColorSpecification;

      expect(schema.name).toBe("Rgba");
      expect(schema.type).toBe("color");
      expect(schema.description).toBe("RGBA color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("r");
      expect(schema.schema?.properties).toHaveProperty("g");
      expect(schema.schema?.properties).toHaveProperty("b");
      expect(schema.schema?.properties).toHaveProperty("a");
      expect(schema.schema?.required).toEqual(["r", "g", "b", "a"]);
    });

    it("should have initializers defined", async () => {
      const schema = (await getBundledSchema("rgba-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("rgba");
      expect(schema.initializers[0].script.script).toBeTruthy();
      expect(schema.initializers[0].script.script).not.toContain("./");
    });

    it("should have conversions defined", async () => {
      const schema = (await getBundledSchema("rgba-color")) as ColorSpecification;

      expect(schema.conversions).toHaveLength(4);

      const hexToRgba = schema.conversions.find(
        (c: { target: string; source: string }) =>
          c.target === "$self" && c.source.includes("hex-color"),
      );
      expect(hexToRgba).toBeDefined();
      expect(hexToRgba?.lossless).toBe(true);
      expect(hexToRgba?.script.script).toBeTruthy();
      expect(hexToRgba?.script.script).not.toContain("./");

      const rgbaToHex = schema.conversions.find(
        (c: { target: string; source: string }) =>
          c.source === "$self" && c.target.includes("hex-color"),
      );
      expect(rgbaToHex).toBeDefined();
      expect(rgbaToHex?.lossless).toBe(false);
      expect(rgbaToHex?.script.script).toBeTruthy();
      expect(rgbaToHex?.script.script).not.toContain("./");

      const rgbToRgba = schema.conversions.find(
        (c: { target: string; source: string }) =>
          c.target === "$self" && c.source.includes("rgb-color"),
      );
      expect(rgbToRgba).toBeDefined();
      expect(rgbToRgba?.lossless).toBe(true);
      expect(rgbToRgba?.script.script).toBeTruthy();
      expect(rgbToRgba?.script.script).not.toContain("./");

      const rgbaToRgb = schema.conversions.find(
        (c: { target: string; source: string }) =>
          c.source === "$self" && c.target.includes("rgb-color"),
      );
      expect(rgbaToRgb).toBeDefined();
      expect(rgbaToRgb?.lossless).toBe(false);
      expect(rgbaToRgb?.script.script).toBeTruthy();
      expect(rgbaToRgb?.script.script).not.toContain("./");
    });
  });

  describe("Initialization", () => {
    it("should initialize RGBA color from object", async () => {
      const result = await executeWithSchema(
        "rgba-color",
        "type",
        `
        variable c: Color.Rgba;
        c.r = 255;
        c.g = 128;
        c.b = 64;
        c.a = 0.5;
        c
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgba");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(128);
      expect((result as any).value.b.value).toBe(64);
      expect((result as any).value.a.value).toBe(0.5);
    });

    it("should access individual color channels", async () => {
      const result = await executeWithSchema(
        "rgba-color",
        "type",
        `
        variable c: Color.Rgba;
        c.r = 200;
        c.g = 150;
        c.b = 100;
        c.a = 0.8;
        c.a
      `,
      );

      expect(result?.constructor.name).toBe("NumberSymbol");
      expect(result?.toString()).toBe("0.8");
    });
  });

  describe("Conversion from HEX to RGBA", () => {

    it("should convert 6-digit HEX to RGBA with alpha 1", async () => {
        const result = await executeWithSchema(
          "rgba-color",
          "type",
          `
          variable c: Color.Hex = #ff5733;
          c.to.rgba()
        `,
        );
  
        expect(result?.constructor.name).toBe("ColorSymbol");
        expect((result as any).subType).toBe("Rgba");
        expect((result as any).value.r.value).toBe(255);
        expect((result as any).value.g.value).toBe(87);
        expect((result as any).value.b.value).toBe(51);
        expect((result as any).value.a.value).toBe(1);
      });
  });



  describe("Conversion from RGB to RGBA", () => {
    it("should convert RGB to RGBA with alpha 1.0", async () => {
      const result = await executeWithSchema(
        "rgba-color",
        "type",
        `
        variable c: Color.Rgb;
        c.r = 255;
        c.g = 87;
        c.b = 51;
        c.to.rgba()
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgba");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(87);
      expect((result as any).value.b.value).toBe(51);
      expect((result as any).value.a.value).toBe(1);
    });
  });

  describe("Conversion from RGBA to RGB", () => {
    it("should convert RGBA to RGB, dropping alpha", async () => {
      const result = await executeWithSchema(
        "rgba-color",
        "type",
        `
        variable c: Color.Rgba;
        c.r = 255;
        c.g = 87;
        c.b = 51;
        c.a = 0.5;
        c.to.rgb()
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(87);
      expect((result as any).value.b.value).toBe(51);
      expect((result as any).value.a).toBeUndefined();
    });
  });
});
