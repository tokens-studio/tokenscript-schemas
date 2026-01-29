/**
 * Unit tests for the Alpha HSL function
 * Sets alpha on a color converted to HSL space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Alpha HSL Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("ts_alpha_hsl", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Alpha HSL");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("ts_alpha_hsl");
    });

    it("should have script defined", async () => {
      const schema = (await getBundledSchema("ts_alpha_hsl", "function")) as FunctionSpecification;

      expect(schema.script).toBeDefined();
      expect(schema.script.script).toBeTruthy();
      expect(schema.script.script).not.toContain("./");
    });
  });

  describe("Function Execution", () => {
    it("should set alpha to 0.5", async () => {
      const result = await executeWithSchema(
        "ts_alpha_hsl",
        "function",
        `
        variable color: Color.HSL;
        color.h = 200; color.s = 0.8; color.l = 0.5;
        ts_alpha_hsl(color, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(0.5);
    });

    it("should set alpha to 0 (fully transparent)", async () => {
      const result = await executeWithSchema(
        "ts_alpha_hsl",
        "function",
        `
        variable color: Color.HSL;
        color.h = 120; color.s = 0.6; color.l = 0.4;
        ts_alpha_hsl(color, 0)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(0);
    });

    it("should set alpha to 1 (fully opaque)", async () => {
      const result = await executeWithSchema(
        "ts_alpha_hsl",
        "function",
        `
        variable color: Color.HSL;
        color.h = 60; color.s = 0.7; color.l = 0.3;
        ts_alpha_hsl(color, 1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(1);
    });

    it("should clamp alpha below 0", async () => {
      const result = await executeWithSchema(
        "ts_alpha_hsl",
        "function",
        `
        variable color: Color.HSL;
        color.h = 0; color.s = 0.5; color.l = 0.5;
        ts_alpha_hsl(color, -0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(0);
    });

    it("should clamp alpha above 1", async () => {
      const result = await executeWithSchema(
        "ts_alpha_hsl",
        "function",
        `
        variable color: Color.HSL;
        color.h = 0; color.s = 0.5; color.l = 0.5;
        ts_alpha_hsl(color, 1.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(1);
    });

    it("should output in HSL color space", async () => {
      const result = await executeWithSchema(
        "ts_alpha_hsl",
        "function",
        `
        variable color: Color.HSL;
        color.h = 240; color.s = 0.7; color.l = 0.5;
        ts_alpha_hsl(color, 0.8)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).value.h).toBeDefined();
      expect((result as any).value.s).toBeDefined();
      expect((result as any).value.l).toBeDefined();
    });
  });
});
