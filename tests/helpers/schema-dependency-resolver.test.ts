import { describe, expect, it } from "vitest";
import {
  collectRequiredSchemas,
  collectRequiredSchemasForList,
  resolveSchemaReference,
} from "./schema-dependency-resolver.js";

describe("Schema Dependency Resolver", () => {
  describe("resolveSchemaReference", () => {
    it("should resolve full URI", () => {
      const ref = resolveSchemaReference(
        "https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/core/rgb-color/0/",
      );
      expect(ref).toEqual({
        slug: "rgb-color",
        type: "type",
        uri: "https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/core/rgb-color/0/",
      });
    });

    it("should resolve relative URI", () => {
      const ref = resolveSchemaReference("/api/v1/core/hex-color/0/");
      expect(ref).toEqual({
        slug: "hex-color",
        type: "type",
        uri: "/api/v1/core/hex-color/0/",
      });
    });

    it("should resolve function URI", () => {
      const ref = resolveSchemaReference("/api/v1/function/invert/0/");
      expect(ref).toEqual({
        slug: "invert",
        type: "function",
        uri: "/api/v1/function/invert/0/",
      });
    });

    it("should resolve plain slug", () => {
      const ref = resolveSchemaReference("rgb-color");
      expect(ref).toEqual({
        slug: "rgb-color",
        type: "type",
        uri: "",
      });
    });

    it("should return null for invalid input", () => {
      const ref = resolveSchemaReference("");
      expect(ref).toBeNull();
    });
  });

  describe("collectRequiredSchemas", () => {
    it("should collect dependencies for rgb-color type", async () => {
      const deps = await collectRequiredSchemas("rgb-color", "type");

      // rgb-color depends on hex-color through conversions
      expect(deps.types).toContain("hex-color");
      expect(deps.functions).toHaveLength(0);
    });

    it("should collect dependencies for invert function", async () => {
      const deps = await collectRequiredSchemas("invert", "function");

      // invert requires rgb-color, which in turn requires hex-color
      expect(deps.types).toContain("rgb-color");
      expect(deps.types).toContain("hex-color");
      expect(deps.functions).toHaveLength(0);
    });

    it("should work with URI input", async () => {
      const deps = await collectRequiredSchemas("/api/v1/core/rgb-color/0/");

      expect(deps.types).toContain("hex-color");
    });

    it("should handle schemas with no dependencies", async () => {
      const deps = await collectRequiredSchemas("hex-color", "type");

      // hex-color has no conversions, so no dependencies
      expect(deps.types).toHaveLength(0);
      expect(deps.functions).toHaveLength(0);
    });
  });

  describe("collectRequiredSchemasForList", () => {
    it("should collect dependencies for multiple schemas", async () => {
      const deps = await collectRequiredSchemasForList([
        { slug: "invert", type: "function" },
        { slug: "hex-color", type: "type" },
      ]);

      // Should include the requested schemas
      expect(deps.functions).toContain("invert");
      expect(deps.types).toContain("hex-color");

      // Should include invert's dependencies
      expect(deps.types).toContain("rgb-color");
    });

    it("should deduplicate overlapping dependencies", async () => {
      const deps = await collectRequiredSchemasForList([
        { slug: "rgb-color", type: "type" },
        { slug: "invert", type: "function" }, // also needs rgb-color
      ]);

      // Should only have rgb-color once
      const rgbCount = deps.types.filter((s) => s === "rgb-color").length;
      expect(rgbCount).toBe(1);

      // Should have both hex-color and rgb-color
      expect(deps.types).toContain("hex-color");
      expect(deps.types).toContain("rgb-color");
      expect(deps.functions).toContain("invert");
    });
  });
});
