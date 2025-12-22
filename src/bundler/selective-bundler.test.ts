import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { bundleSelectiveSchemas } from "./selective-bundler.js";

const SCHEMAS_DIR = join(process.cwd(), "src/schemas");

describe("Selective Bundler", () => {
  it("should bundle a single type schema", async () => {
    const result = await bundleSelectiveSchemas({
      schemas: ["hex-color"],
      schemasDir: SCHEMAS_DIR,
    });

    expect(result.schemas).toHaveLength(1);
    expect(result.schemas[0].uri).toContain("hex-color");
    expect(result.schemas[0].schema.type).toBe("color");
    expect(result.metadata.requestedSchemas).toEqual(["hex-color"]);
  });

  it("should bundle multiple type schemas with dependencies", async () => {
    const result = await bundleSelectiveSchemas({
      schemas: ["rgb-color", "oklch-color"],
      schemasDir: SCHEMAS_DIR,
    });

    // Should include requested schemas plus dependencies
    expect(result.schemas.length).toBeGreaterThan(2);

    // Check that requested schemas are included
    const uris = result.schemas.map((s) => s.uri);
    expect(uris.some((uri) => uri.includes("rgb-color"))).toBe(true);
    expect(uris.some((uri) => uri.includes("oklch-color"))).toBe(true);

    // Check that hex-color (a common dependency) is included
    expect(uris.some((uri) => uri.includes("hex-color"))).toBe(true);
  });

  it("should bundle function schema with type dependencies", async () => {
    const result = await bundleSelectiveSchemas({
      schemas: ["function:invert"],
      schemasDir: SCHEMAS_DIR,
    });

    const uris = result.schemas.map((s) => s.uri);

    // Should include the function itself
    expect(uris.some((uri) => uri.includes("/function/invert/"))).toBe(true);

    // Should include type dependencies (rgb-color, hex-color)
    expect(uris.some((uri) => uri.includes("rgb-color"))).toBe(true);
    expect(uris.some((uri) => uri.includes("hex-color"))).toBe(true);
  });

  it("should inline script content", async () => {
    const result = await bundleSelectiveSchemas({
      schemas: ["hex-color"],
      schemasDir: SCHEMAS_DIR,
    });

    const hexSchema = result.schemas[0].schema;

    if (hexSchema.type === "color") {
      // Check that initializer script is inlined (not a file reference)
      const initScript = hexSchema.initializers[0].script.script;
      expect(initScript).not.toContain("./");
      expect(initScript.length).toBeGreaterThan(10);
    }
  });

  it("should use provided base URL in URIs", async () => {
    const customBaseUrl = "https://custom.example.com";

    const result = await bundleSelectiveSchemas({
      schemas: ["hex-color"],
      schemasDir: SCHEMAS_DIR,
      baseUrl: customBaseUrl,
    });

    expect(result.schemas[0].uri).toContain(customBaseUrl);
  });

  it("should include metadata", async () => {
    const result = await bundleSelectiveSchemas({
      schemas: ["rgb-color"],
      schemasDir: SCHEMAS_DIR,
    });

    expect(result.metadata.requestedSchemas).toEqual(["rgb-color"]);
    expect(result.metadata.resolvedDependencies).toContain("rgb-color");
    expect(result.metadata.resolvedDependencies).toContain("hex-color");
    expect(result.metadata.generatedAt).toBeDefined();
    expect(new Date(result.metadata.generatedAt).getTime()).toBeGreaterThan(0);
  });
});
