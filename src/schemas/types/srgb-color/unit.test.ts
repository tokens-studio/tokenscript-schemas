import type { ColorSpecification } from "@/bundler/types.js";
import {
  Config,
  createInterpreter,
  getBundledSchema,
  setupColorManagerWithSchema,
  setupColorManagerWithSchemas,
} from "@tests/helpers/schema-test-utils.js";
import { describe, expect, it } from "vitest";

describe("SRGB Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("srgb-color")) as ColorSpecification;

      expect(schema.name).toBe("SRGB");
      expect(schema.type).toBe("color");
      expect(schema.description).toBe("sRGB color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("r");
      expect(schema.schema?.properties).toHaveProperty("g");
      expect(schema.schema?.properties).toHaveProperty("b");
      expect(schema.schema?.required).toEqual(["r", "g", "b"]);
    });

    it("should have initializers defined", async () => {
      const schema = (await getBundledSchema("srgb-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("srgb");
      expect(schema.initializers[0].script.script).toBeTruthy();
      expect(schema.initializers[0].script.script).not.toContain("./");
    });

    it("should have conversions defined", async () => {
      const schema = (await getBundledSchema("srgb-color")) as ColorSpecification;

      expect(schema.conversions).toHaveLength(2);

      // Check HEX to SRGB conversion
      const hexToSrgb = schema.conversions.find(
        (c: { target: string; source: string }) =>
          c.target === "$self" && c.source.includes("hex-color"),
      );
      expect(hexToSrgb).toBeDefined();
      expect(hexToSrgb?.lossless).toBe(true);
      expect(hexToSrgb?.script.script).toBeTruthy();
      expect(hexToSrgb?.script.script).not.toContain("./");

      // Check SRGB to HEX conversion
      const srgbToHex = schema.conversions.find(
        (c: { target: string; source: string }) =>
          c.source === "$self" && c.target.includes("hex-color"),
      );
      expect(srgbToHex).toBeDefined();
      expect(srgbToHex?.lossless).toBe(true);
      expect(srgbToHex?.script.script).toBeTruthy();
      expect(srgbToHex?.script.script).not.toContain("./");
    });
  });

  describe("Initialization", () => {
    it("should initialize SRGB color from object", async () => {
      const colorManager = await setupColorManagerWithSchema("srgb-color");
      const config = new Config({ colorManager });

      const code = `
        variable c: Color.SRGB;
        c.r = 255;
        c.g = 128;
        c.b = 64;
        c
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(128);
      expect((result as any).value.b.value).toBe(64);
    });

    it("should access individual color channels", async () => {
      const colorManager = await setupColorManagerWithSchema("srgb-color");
      const config = new Config({ colorManager });

      const code = `
        variable c: Color.SRGB;
        c.r = 200;
        c.g = 150;
        c.b = 100;
        c.r
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("NumberSymbol");
      expect(result?.toString()).toBe("200");
    });
  });

  describe("Conversion from HEX to SRGB", () => {
    it("should convert 6-digit HEX to SRGB", async () => {
      const config = await setupColorManagerWithSchemas(["hex-color", "srgb-color"]);

      const code = `
        variable c: Color.Hex = #ff5733;
        c.to.srgb()
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(87);
      expect((result as any).value.b.value).toBe(51);
    });

    it("should convert 3-digit HEX to SRGB", async () => {
      const config = await setupColorManagerWithSchemas(["hex-color", "srgb-color"]);

      const code = `
        variable c: Color.Hex = #f53;
        c.to.srgb()
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(85);
      expect((result as any).value.b.value).toBe(51);
    });

    it("should convert black HEX to SRGB", async () => {
      const config = await setupColorManagerWithSchemas(["hex-color", "srgb-color"]);

      const code = `
        variable c: Color.Hex = #000;
        c.to.srgb()
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(0);
      expect((result as any).value.g.value).toBe(0);
      expect((result as any).value.b.value).toBe(0);
    });

    it("should convert white HEX to SRGB", async () => {
      const config = await setupColorManagerWithSchemas(["hex-color", "srgb-color"]);

      const code = `
        variable c: Color.Hex = #ffffff;
        c.to.srgb()
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(255);
      expect((result as any).value.b.value).toBe(255);
    });
  });

  describe("Conversion from SRGB to HEX", () => {
    it("should convert SRGB to HEX", async () => {
      const config = await setupColorManagerWithSchemas(["hex-color", "srgb-color"]);

      const code = `
        variable c: Color.SRGB;
        c.r = 255;
        c.g = 87;
        c.b = 51;
        c.to.hex()
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Hex");
      expect(result?.toString()).toBe("#ff5733");
    });

    it("should convert SRGB with low values to HEX", async () => {
      const config = await setupColorManagerWithSchemas(["hex-color", "srgb-color"]);

      const code = `
        variable c: Color.SRGB;
        c.r = 10;
        c.g = 5;
        c.b = 0;
        c.to.hex()
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Hex");
      expect(result?.toString()).toBe("#0a0500");
    });

    it("should convert black SRGB to HEX", async () => {
      const config = await setupColorManagerWithSchemas(["hex-color", "srgb-color"]);

      const code = `
        variable c: Color.SRGB;
        c.r = 0;
        c.g = 0;
        c.b = 0;
        c.to.hex()
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Hex");
      expect(result?.toString()).toBe("#000000");
    });

    it("should convert white SRGB to HEX", async () => {
      const config = await setupColorManagerWithSchemas(["hex-color", "srgb-color"]);

      const code = `
        variable c: Color.SRGB;
        c.r = 255;
        c.g = 255;
        c.b = 255;
        c.to.hex()
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Hex");
      expect(result?.toString()).toBe("#ffffff");
    });
  });

  describe("Round-trip Conversions", () => {
    it("should maintain color values through HEX -> SRGB -> HEX", async () => {
      const config = await setupColorManagerWithSchemas(["hex-color", "srgb-color"]);

      const code = `
        variable original: Color.Hex = #3498db;
        variable srgb: Color.SRGB = original.to.srgb();
        variable back: Color.Hex = srgb.to.hex();
        back
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Hex");
      expect(result?.toString()).toBe("#3498db");
    });

    it("should maintain color values through SRGB -> HEX -> SRGB", async () => {
      const config = await setupColorManagerWithSchemas(["hex-color", "srgb-color"]);

      const code = `
        variable original: Color.SRGB;
        original.r = 52;
        original.g = 152;
        original.b = 219;
        
        variable hex: Color.Hex = original.to.hex();
        variable back: Color.SRGB = hex.to.srgb();
        back
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(52);
      expect((result as any).value.g.value).toBe(152);
      expect((result as any).value.b.value).toBe(219);
    });
  });

  describe("Identity Conversions", () => {
    it("should handle SRGB to SRGB identity conversion", async () => {
      const colorManager = await setupColorManagerWithSchema("srgb-color");
      const config = new Config({ colorManager });

      const code = `
        variable c: Color.SRGB;
        c.r = 100;
        c.g = 150;
        c.b = 200;
        c.to.srgb()
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(100);
      expect((result as any).value.g.value).toBe(150);
      expect((result as any).value.b.value).toBe(200);
    });
  });
});
