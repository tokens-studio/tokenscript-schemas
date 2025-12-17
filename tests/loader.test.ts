import { describe, expect, test } from "vitest";
import { loadRegistry, loadSchema, loadTypes, loadFunctions } from "../src/loader/index.js";

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
    
    const rgbaColor = types.find((t) => t.slug === "rgba-color");
    expect(rgbaColor).toBeDefined();
    expect(rgbaColor?.type).toBe("type");
    expect(rgbaColor?.name).toBe("RGBA Color");
  });

  test("loads all function schemas", async () => {
    const functions = await loadFunctions();
    
    expect(functions).toBeInstanceOf(Array);
    expect(functions.length).toBeGreaterThan(0);
    
    const contrast = functions.find((f) => f.slug === "contrast");
    expect(contrast).toBeDefined();
    expect(contrast?.type).toBe("function");
  });

  test("loads specific schema by slug", async () => {
    const rgbaColor = await loadSchema("rgba-color", "type");
    
    expect(rgbaColor).toBeDefined();
    expect(rgbaColor?.slug).toBe("rgba-color");
    expect(rgbaColor?.type).toBe("type");
    expect(rgbaColor?.schema).toBeDefined();
    expect(rgbaColor?.scripts).toBeDefined();
  });

  test("returns null for non-existent schema", async () => {
    const nonExistent = await loadSchema("non-existent-schema", "type");
    
    expect(nonExistent).toBeNull();
  });

  test("rgba-color has expected scripts", async () => {
    const rgbaColor = await loadSchema("rgba-color", "type");
    
    expect(rgbaColor?.scripts).toBeDefined();
    expect(Object.keys(rgbaColor?.scripts || {})).toContain("to-hex-color");
    expect(Object.keys(rgbaColor?.scripts || {})).toContain("from-hex-color");
  });

  test("rgba-color has valid schema definition", async () => {
    const rgbaColor = await loadSchema("rgba-color", "type");
    
    expect(rgbaColor?.schema).toBeDefined();
    const schema = rgbaColor?.schema as any;
    
    expect(schema.type).toBe("object");
    expect(schema.required).toContain("r");
    expect(schema.required).toContain("g");
    expect(schema.required).toContain("b");
    expect(schema.required).toContain("a");
  });
});
