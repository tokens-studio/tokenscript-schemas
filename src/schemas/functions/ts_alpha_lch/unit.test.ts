/**
 * Unit tests for the Alpha LCH function
 * Sets alpha on a color converted to CIE LCH space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Alpha LCH Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("ts_alpha_lch", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Alpha LCH");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("ts_alpha_lch");
    });

    it("should have script defined", async () => {
      const schema = (await getBundledSchema("ts_alpha_lch", "function")) as FunctionSpecification;

      expect(schema.script).toBeDefined();
      expect(schema.script.script).toBeTruthy();
      expect(schema.script.script).not.toContain("./");
    });
  });

  describe("Function Execution", () => {
    it("should set alpha to 0.5", async () => {
      const result = await executeWithSchema(
        "ts_alpha_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 50; color.c = 30; color.h = 180;
        ts_alpha_lch(color, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(0.5);
    });

    it("should set alpha to 0 (fully transparent)", async () => {
      const result = await executeWithSchema(
        "ts_alpha_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 70; color.c = 40; color.h = 90;
        ts_alpha_lch(color, 0)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(0);
    });

    it("should set alpha to 1 (fully opaque)", async () => {
      const result = await executeWithSchema(
        "ts_alpha_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 30; color.c = 20; color.h = 270;
        ts_alpha_lch(color, 1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(1);
    });

    it("should clamp alpha below 0", async () => {
      const result = await executeWithSchema(
        "ts_alpha_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 50; color.c = 30; color.h = 180;
        ts_alpha_lch(color, -0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(0);
    });

    it("should clamp alpha above 1", async () => {
      const result = await executeWithSchema(
        "ts_alpha_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 50; color.c = 30; color.h = 180;
        ts_alpha_lch(color, 1.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(1);
    });

    it("should output in LCH color space", async () => {
      const result = await executeWithSchema(
        "ts_alpha_lch",
        "function",
        `
        variable color: Color.LCH;
        color.l = 50; color.c = 30; color.h = 200;
        ts_alpha_lch(color, 0.7)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).value.l).toBeDefined();
      expect((result as any).value.c).toBeDefined();
      expect((result as any).value.h).toBeDefined();
    });
  });
});
