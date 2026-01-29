/**
 * Unit tests for the Alpha P3 function
 * Sets alpha on a color converted to Display P3 space
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Alpha P3 Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("ts_alpha_p3", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Alpha P3");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("ts_alpha_p3");
    });

    it("should have script defined", async () => {
      const schema = (await getBundledSchema("ts_alpha_p3", "function")) as FunctionSpecification;

      expect(schema.script).toBeDefined();
      expect(schema.script.script).toBeTruthy();
      expect(schema.script.script).not.toContain("./");
    });
  });

  describe("Function Execution", () => {
    it("should set alpha to 0.5", async () => {
      const result = await executeWithSchema(
        "ts_alpha_p3",
        "function",
        `
        variable color: Color.P3;
        color.r = 0.8; color.g = 0.3; color.b = 0.5;
        ts_alpha_p3(color, 0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(0.5);
    });

    it("should set alpha to 0 (fully transparent)", async () => {
      const result = await executeWithSchema(
        "ts_alpha_p3",
        "function",
        `
        variable color: Color.P3;
        color.r = 0.5; color.g = 0.5; color.b = 0.5;
        ts_alpha_p3(color, 0)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(0);
    });

    it("should set alpha to 1 (fully opaque)", async () => {
      const result = await executeWithSchema(
        "ts_alpha_p3",
        "function",
        `
        variable color: Color.P3;
        color.r = 0.2; color.g = 0.5; color.b = 0.3;
        ts_alpha_p3(color, 1)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(1);
    });

    it("should clamp alpha below 0", async () => {
      const result = await executeWithSchema(
        "ts_alpha_p3",
        "function",
        `
        variable color: Color.P3;
        color.r = 0.5; color.g = 0.5; color.b = 0.5;
        ts_alpha_p3(color, -0.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(0);
    });

    it("should clamp alpha above 1", async () => {
      const result = await executeWithSchema(
        "ts_alpha_p3",
        "function",
        `
        variable color: Color.P3;
        color.r = 0.5; color.g = 0.5; color.b = 0.5;
        ts_alpha_p3(color, 1.5)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).alpha).toBe(1);
    });

    it("should output in P3 color space", async () => {
      const result = await executeWithSchema(
        "ts_alpha_p3",
        "function",
        `
        variable color: Color.P3;
        color.r = 0.5; color.g = 0.3; color.b = 0.7;
        ts_alpha_p3(color, 0.8)
        `,
      );

      expect(result?.constructor.name).toBe("ColorSymbol");
      expect((result as any).value.r).toBeDefined();
      expect((result as any).value.g).toBeDefined();
      expect((result as any).value.b).toBeDefined();
    });
  });
});
