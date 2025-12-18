import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils.js";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types.js";

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
        "https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/core/rgb-color/0/",
      );
    });
  });

  describe("Function Execution", () => {
    it("should invert RGB color", async () => {
      const result = await executeWithSchema(
        "invert",
        "function",
        `
        variable original: Color.Rgb = rgb(255, 128, 64);
        invert(original)
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(0);
      expect((result as any).value.g.value).toBe(127);
      expect((result as any).value.b.value).toBe(191);
    });

    it("should invert HEX color", async () => {
      const result = await executeWithSchema(
        "invert",
        "function",
        `
        variable original: Color.Hex = #ff8040;
        invert(original)
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(0);
      expect((result as any).value.g.value).toBe(127);
      expect((result as any).value.b.value).toBe(191);
    });

    it("should invert black to white", async () => {
      const result = await executeWithSchema(
        "invert",
        "function",
        `
        variable black: Color.Hex = #000000;
        invert(black)
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(255);
      expect((result as any).value.b.value).toBe(255);
    });

    it("should invert white to black", async () => {
      const result = await executeWithSchema(
        "invert",
        "function",
        `
        variable white: Color.Hex = #ffffff;
        invert(white)
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(0);
      expect((result as any).value.g.value).toBe(0);
      expect((result as any).value.b.value).toBe(0);
    });

    it("should invert gray (127.5 rounds to 128)", async () => {
      const result = await executeWithSchema(
        "invert",
        "function",
        `
        variable gray: Color.Hex = #7f7f7f;
        invert(gray)
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(128);
      expect((result as any).value.g.value).toBe(128);
      expect((result as any).value.b.value).toBe(128);
    });
  });

  describe("Round-trip Inversions", () => {
    it("should return to original color when inverted twice", async () => {
      const result = await executeWithSchema(
        "invert",
        "function",
        `
        variable original: Color.Hex = #3498db;
        variable inverted: Color.Rgb = invert(original);
        variable backToOriginal: Color.Rgb = invert(inverted);
        backToOriginal.to.hex()
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Hex");
      expect(result?.toString()).toBe("#3498db");
    });

    it("should handle double inversion of RGB color", async () => {
      const result = await executeWithSchema(
        "invert",
        "function",
        `
        variable original: Color.Rgb = rgb(100, 150, 200);
        variable inverted: Color.Rgb = invert(original);
        variable backToOriginal: Color.Rgb = invert(inverted);
        backToOriginal
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(100);
      expect((result as any).value.g.value).toBe(150);
      expect((result as any).value.b.value).toBe(200);
    });
  });

  describe("Edge Cases", () => {
    it("should handle pure red", async () => {
      const result = await executeWithSchema(
        "invert",
        "function",
        `
        variable red: Color.Hex = #ff0000;
        invert(red)
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(0);
      expect((result as any).value.g.value).toBe(255);
      expect((result as any).value.b.value).toBe(255);
    });

    it("should handle pure green", async () => {
      const result = await executeWithSchema(
        "invert",
        "function",
        `
        variable green: Color.Hex = #00ff00;
        invert(green)
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(0);
      expect((result as any).value.b.value).toBe(255);
    });

    it("should handle pure blue", async () => {
      const result = await executeWithSchema(
        "invert",
        "function",
        `
        variable blue: Color.Hex = #0000ff;
        invert(blue)
      `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
      expect((result as any).value.r.value).toBe(255);
      expect((result as any).value.g.value).toBe(255);
      expect((result as any).value.b.value).toBe(0);
    });
  });
});
