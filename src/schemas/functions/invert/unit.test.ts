import type { FunctionSpecification } from "@/bundler/types.js";
import {
  createInterpreter,
  getBundledSchema,
  setupColorManagerWithSchemas,
} from "@tests/helpers/schema-test-utils.js";
import { describe, expect, it } from "vitest";

describe("Invert Function Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("invert", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Invert Color");
      expect(schema.type).toBe("function");
      expect(schema.description).toBe(
        "Inverts a color by inverting each RGB channel (R' = 255 - R, G' = 255 - G, B' = 255 - B).",
      );
      expect(schema.keyword).toBe("invert");
      expect(schema.input).toBeDefined();
      expect(schema.input?.type).toBe("object");
      expect(schema.input?.properties).toHaveProperty("color");
    });

    it("should have script defined", async () => {
      const schema = (await getBundledSchema("invert", "function")) as FunctionSpecification;

      expect(schema.script).toBeDefined();
      expect(schema.script.script).toBeTruthy();
      expect(schema.script.script).not.toContain("./");
    });

    it("should have requirements", async () => {
      const schema = (await getBundledSchema("invert", "function")) as FunctionSpecification;

      expect(schema.requirements).toBeDefined();
      expect(schema.requirements).toContain(
        "https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/core/srgb-color/0/",
      );
    });
  });

  describe("Function Execution", () => {
    it("should invert RGB color", async () => {
      const config = await setupColorManagerWithSchemas(
        ["srgb-color", "invert"],
        ["type", "function"],
      );

      const code = `
        variable original: Color.SRGB = srgb(255, 128, 64);
        invert(original)
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(0);
      expect((result as any).value.g.value).toBe(127);
      expect((result as any).value.b.value).toBe(191);
    });

    it("should invert HEX color", async () => {
      const config = await setupColorManagerWithSchemas(
        ["hex-color", "srgb-color", "invert"],
        ["type", "type", "function"],
      );

      const code = `
        variable original: Color.Hex = #ff8040;
        invert(original)
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(0);
      expect((result as any).value.g.value).toBe(127);
      expect((result as any).value.b.value).toBe(191);
    });

    it("should invert black to white", async () => {
      const config = await setupColorManagerWithSchemas(
        ["hex-color", "srgb-color", "invert"],
        ["type", "type", "function"],
      );

      const code = `
        variable black: Color.Hex = #000000;
        invert(black)
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(255);
      expect((result as any).value.b.value).toBe(255);
    });

    it("should invert white to black", async () => {
      const config = await setupColorManagerWithSchemas(
        ["hex-color", "srgb-color", "invert"],
        ["type", "type", "function"],
      );

      const code = `
        variable white: Color.Hex = #ffffff;
        invert(white)
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(0);
      expect((result as any).value.g.value).toBe(0);
      expect((result as any).value.b.value).toBe(0);
    });

    it("should invert gray (127.5 rounds to 128)", async () => {
      const config = await setupColorManagerWithSchemas(
        ["hex-color", "srgb-color", "invert"],
        ["type", "type", "function"],
      );

      const code = `
        variable gray: Color.Hex = #7f7f7f;
        invert(gray)
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(128);
      expect((result as any).value.g.value).toBe(128);
      expect((result as any).value.b.value).toBe(128);
    });
  });

  describe("Round-trip Inversions", () => {
    it("should return to original color when inverted twice", async () => {
      const config = await setupColorManagerWithSchemas(
        ["hex-color", "srgb-color", "invert"],
        ["type", "type", "function"],
      );

      const code = `
        variable original: Color.Hex = #3498db;
        variable inverted: Color.SRGB = invert(original);
        variable backToOriginal: Color.SRGB = invert(inverted);
        backToOriginal.to.hex()
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Hex");
      expect(result?.toString()).toBe("#3498db");
    });

    it("should handle double inversion of RGB color", async () => {
      const config = await setupColorManagerWithSchemas(
        ["srgb-color", "invert"],
        ["type", "function"],
      );

      const code = `
        variable original: Color.SRGB = srgb(100, 150, 200);
        variable inverted: Color.SRGB = invert(original);
        variable backToOriginal: Color.SRGB = invert(inverted);
        backToOriginal
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

  describe("Edge Cases", () => {
    it("should handle pure red", async () => {
      const config = await setupColorManagerWithSchemas(
        ["hex-color", "srgb-color", "invert"],
        ["type", "type", "function"],
      );

      const code = `
        variable red: Color.Hex = #ff0000;
        invert(red)
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(0);
      expect((result as any).value.g.value).toBe(255);
      expect((result as any).value.b.value).toBe(255);
    });

    it("should handle pure green", async () => {
      const config = await setupColorManagerWithSchemas(
        ["hex-color", "srgb-color", "invert"],
        ["type", "type", "function"],
      );

      const code = `
        variable green: Color.Hex = #00ff00;
        invert(green)
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(0);
      expect((result as any).value.b.value).toBe(255);
    });

    it("should handle pure blue", async () => {
      const config = await setupColorManagerWithSchemas(
        ["hex-color", "srgb-color", "invert"],
        ["type", "type", "function"],
      );

      const code = `
        variable blue: Color.Hex = #0000ff;
        invert(blue)
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("SRGB");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(255);
      expect((result as any).value.b.value).toBe(0);
    });
  });
});
