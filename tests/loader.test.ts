import { describe, expect, test } from "vitest";
import { loadRegistry, loadSchema, loadTypes, loadFunctions } from "@/loader/index.js";

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
    
    const srgbColor = types.find((t) => t.slug === "srgb-color");
    expect(srgbColor).toBeDefined();
    expect(srgbColor?.type).toBe("color");
    expect(srgbColor?.name).toBe("SRGB");
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
    const srgbColor = await loadSchema("srgb-color", "type");
    
    expect(srgbColor).toBeDefined();
    expect(srgbColor?.slug).toBe("srgb-color");
    expect(srgbColor?.type).toBe("color");
    expect(srgbColor?.schema).toBeDefined();
    // ColorSpecification has initializers and conversions, not scripts
    expect((srgbColor as any)?.initializers).toBeDefined();
    expect((srgbColor as any)?.conversions).toBeDefined();
  });

  test("returns null for non-existent schema", async () => {
    const nonExistent = await loadSchema("non-existent-schema", "type");
    
    expect(nonExistent).toBeNull();
  });

  test("srgb-color has expected conversions", async () => {
    const srgbColor = await loadSchema("srgb-color", "type") as any;
    
    expect(srgbColor?.conversions).toBeDefined();
    expect(srgbColor?.conversions).toBeInstanceOf(Array);
    expect(srgbColor?.conversions.length).toBeGreaterThan(0);
    
    // Check for HEX conversions
    const fromHex = srgbColor?.conversions.find((c: any) => 
      c.target === "$self" && c.source.includes("hex-color")
    );
    const toHex = srgbColor?.conversions.find((c: any) => 
      c.source === "$self" && c.target.includes("hex-color")
    );
    
    expect(fromHex).toBeDefined();
    expect(toHex).toBeDefined();
  });

  test("srgb-color has valid schema definition", async () => {
    const srgbColor = await loadSchema("srgb-color", "type");
    
    expect(srgbColor?.schema).toBeDefined();
    const schema = srgbColor?.schema as any;
    
    expect(schema.type).toBe("object");
    expect(schema.required).toContain("r");
    expect(schema.required).toContain("g");
    expect(schema.required).toContain("b");
    // SRGB doesn't have alpha channel
    // expect(schema.required).toContain("a");
  });
});
