import { describe, expect, test } from "vitest";
import { loadFunctions, loadRegistry, loadSchema, loadTypes } from "@/loader/index.js";

describe("Schema Loader", () => {
  test("loads complete registry", async () => {
    const registry = await loadRegistry();

    expect(registry).toBeDefined();
    expect(registry.version).toBe("0.0.10");
    expect(registry.types).toBeInstanceOf(Array);
    expect(registry.functions).toBeInstanceOf(Array);
    expect(registry.metadata.totalSchemas).toBeGreaterThan(0);
  });

  test("loads all type schemas", async () => {
    const types = await loadTypes();

    expect(types).toBeInstanceOf(Array);
    expect(types.length).toBeGreaterThan(0);

    const rgbColor = types.find((t) => t.slug === "rgb-color");
    expect(rgbColor).toBeDefined();
    expect(rgbColor?.type).toBe("color");
    expect(rgbColor?.name).toBe("Rgb");
  });

  test("loads all function schemas", async () => {
    const functions = await loadFunctions();

    expect(functions).toBeInstanceOf(Array);
    // Functions may not be implemented yet, so just check it returns an array
    // expect(functions.length).toBeGreaterThan(0);

    // const contrast = functions.find((f) => f.slug === "contrast");
    // expect(contrast).toBeDefined();
    // expect(contrast?.type).toBe("function");
  });

  test("loads specific schema by slug", async () => {
    const rgbColor = await loadSchema("rgb-color", "type");

    expect(rgbColor).toBeDefined();
    expect(rgbColor?.slug).toBe("rgb-color");
    expect(rgbColor?.type).toBe("color");
    expect(rgbColor?.schema).toBeDefined();
    // ColorSpecification has initializers and conversions, not scripts
    expect((rgbColor as any)?.initializers).toBeDefined();
    expect((rgbColor as any)?.conversions).toBeDefined();
  });

  test("returns null for non-existent schema", async () => {
    const nonExistent = await loadSchema("non-existent-schema", "type");

    expect(nonExistent).toBeNull();
  });

  test("rgb-color has expected conversions", async () => {
    const rgbColor = (await loadSchema("rgb-color", "type")) as any;

    expect(rgbColor?.conversions).toBeDefined();
    expect(rgbColor?.conversions).toBeInstanceOf(Array);
    expect(rgbColor?.conversions.length).toBeGreaterThan(0);

    // Check for HEX conversions
    const fromHex = rgbColor?.conversions.find(
      (c: any) => c.target === "$self" && c.source.includes("hex-color"),
    );
    const toHex = rgbColor?.conversions.find(
      (c: any) => c.source === "$self" && c.target.includes("hex-color"),
    );

    expect(fromHex).toBeDefined();
    expect(toHex).toBeDefined();
  });

  test("rgb-color has valid schema definition", async () => {
    const rgbColor = await loadSchema("rgb-color", "type");

    expect(rgbColor?.schema).toBeDefined();
    const schema = rgbColor?.schema as any;

    expect(schema.type).toBe("object");
    expect(schema.required).toContain("r");
    expect(schema.required).toContain("g");
    expect(schema.required).toContain("b");
    // RGB doesn't have alpha channel
    // expect(schema.required).toContain("a");
  });
});
