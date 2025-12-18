/**
 * Example tests demonstrating the new automatic dependency resolution
 */

import { describe, expect, it } from "vitest";
import {
  createInterpreter,
  setupConfigWithDependencies,
  setupConfigWithMultipleDependencies,
} from "./schema-test-utils";

describe("Automatic Dependency Resolution Examples", () => {
  describe("setupConfigWithDependencies", () => {
    it("should automatically load rgb-color with its hex-color dependency", async () => {
      // OLD WAY (manual):
      // const config = await setupColorManagerWithSchemas(["rgb-color", "hex-color"]);

      // NEW WAY (automatic):
      const config = await setupConfigWithDependencies("rgb-color");

      // Test that both rgb-color and hex-color are available
      const code = `
        variable rgb: Color.Rgb = rgb(255, 128, 64);
        variable hex: Color.Hex = #ff8040;
        
        // This conversion requires both schemas to be loaded
        hex.to.rgb()
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");
    });

    it("should automatically load invert function with all its dependencies", async () => {
      // The invert function requires rgb-color, which requires hex-color
      // All are loaded automatically!
      const config = await setupConfigWithDependencies("invert", "function");

      const code = `
        variable c: Color.Hex = #ffffff;
        invert(c)
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");

      // Inverted white should be black (0, 0, 0)
      expect((result as any).value.r.value).toBe(0);
      expect((result as any).value.g.value).toBe(0);
      expect((result as any).value.b.value).toBe(0);
    });

    it("should work with URI instead of slug", async () => {
      const config = await setupConfigWithDependencies("/api/v1/core/rgb-color/0/");

      const code = `
        variable rgb: Color.Rgb = rgb(100, 150, 200);
        rgb
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).value.r.value).toBe(100);
    });
  });

  describe("setupConfigWithMultipleDependencies", () => {
    it("should load multiple schemas with their dependencies", async () => {
      // Load both invert function and explicitly request hex-color
      // Dependencies are automatically resolved and deduplicated
      const config = await setupConfigWithMultipleDependencies([
        { slug: "invert", type: "function" },
        { slug: "hex-color", type: "type" },
      ]);

      const code = `
        variable hex: Color.Hex = #ff0000;
        variable inverted: Color.Rgb = invert(hex);
        
        // Inverted red (#ff0000) should be cyan (0, 255, 255)
        inverted
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).value.r.value).toBe(0);
      expect((result as any).value.g.value).toBe(255);
      expect((result as any).value.b.value).toBe(255);
    });

    it("should handle overlapping dependencies gracefully", async () => {
      // Both rgb-color and invert need hex-color
      // Should be loaded only once
      const config = await setupConfigWithMultipleDependencies([
        { slug: "rgb-color", type: "type" },
        { slug: "invert", type: "function" },
      ]);

      const code = `
        variable rgb: Color.Rgb = rgb(100, 200, 50);
        variable inverted: Color.Rgb = invert(rgb);
        
        inverted
      `;

      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).subType).toBe("Rgb");

      // Inverted values
      expect((result as any).value.r.value).toBe(155); // 255 - 100
      expect((result as any).value.g.value).toBe(55); // 255 - 200
      expect((result as any).value.b.value).toBe(205); // 255 - 50
    });
  });

  describe("Comparison: Old vs New Approach", () => {
    it("OLD: Manual dependency management", async () => {
      // Had to manually list all dependencies
      const { setupColorManagerWithSchemas } = await import("./schema-test-utils");
      const config = await setupColorManagerWithSchemas(
        ["invert", "rgb-color", "hex-color"],
        ["function", "type", "type"],
      );

      const code = `variable c: Color.Hex = #123456; invert(c)`;
      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
    });

    it("NEW: Automatic dependency resolution", async () => {
      // Just specify what you need, dependencies are resolved automatically!
      const config = await setupConfigWithDependencies("invert", "function");

      const code = `variable c: Color.Hex = #123456; invert(c)`;
      const interpreter = createInterpreter(code, {}, config);
      const result = interpreter.interpret();

      expect(result?.constructor.name).toBe("ColorSymbol");
    });
  });
});
