/**
 * Unit tests for the Match Alpha function
 * Finds the alpha that blends foreground over background to produce reference
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import { describe, expect, it } from "vitest";
import type { FunctionSpecification } from "@/bundler/types";

describe("Match Alpha Function", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("match_alpha", "function")) as FunctionSpecification;

      expect(schema.name).toBe("Match Alpha");
      expect(schema.type).toBe("function");
      expect(schema.keyword).toBe("match_alpha");
    });
  });

  describe("Function Execution", () => {
    it("should return alpha=0 when reference equals background", async () => {
      const result = await executeWithSchema(
        "match_alpha",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 1; fg.g = 0; fg.b = 0;
        variable bg: Color.SRGB;
        bg.r = 0.5; bg.g = 0.5; bg.b = 0.5;
        variable ref: Color.SRGB;
        ref.r = 0.5; ref.g = 0.5; ref.b = 0.5;
        match_alpha(fg, bg, ref)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const inRange = list[0].value;
      const alpha = list[1].value;

      expect(inRange).toBe(1);
      expect(alpha).toBeCloseTo(0, 2);
    });

    it("should return alpha=1 when reference equals foreground", async () => {
      const result = await executeWithSchema(
        "match_alpha",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 1; fg.g = 0; fg.b = 0;
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 0; bg.b = 0;
        variable ref: Color.SRGB;
        ref.r = 1; ref.g = 0; ref.b = 0;
        match_alpha(fg, bg, ref)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const inRange = list[0].value;
      const alpha = list[1].value;

      expect(inRange).toBe(1);
      expect(alpha).toBeCloseTo(1, 2);
    });

    it("should find alpha=0.5 for sRGB midpoint blend", async () => {
      // Blending in sRGB space: white to black with ref = 0.5 gray
      // alpha = (0.5 - 0) / (1 - 0) = 0.5
      const result = await executeWithSchema(
        "match_alpha",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 1; fg.g = 1; fg.b = 1;
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 0; bg.b = 0;
        variable ref: Color.SRGB;
        ref.r = 0.5; ref.g = 0.5; ref.b = 0.5;
        match_alpha(fg, bg, ref)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const inRange = list[0].value;
      const alpha = list[1].value;

      expect(inRange).toBe(1);
      expect(alpha).toBeCloseTo(0.5, 2);
    });

    it("should find correct alpha for 25% blend", async () => {
      // Blending red and blue in sRGB space
      // ref.r = 0.25, fg.r = 1, bg.r = 0 → alpha_r = 0.25
      // ref.b = 0.75, fg.b = 0, bg.b = 1 → alpha_b = (0.75 - 1) / (0 - 1) = 0.25
      const result = await executeWithSchema(
        "match_alpha",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 1; fg.g = 0; fg.b = 0;
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 0; bg.b = 1;
        variable ref: Color.SRGB;
        ref.r = 0.25; ref.g = 0; ref.b = 0.75;
        match_alpha(fg, bg, ref)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const inRange = list[0].value;
      const alpha = list[1].value;

      expect(inRange).toBe(1);
      expect(alpha).toBeCloseTo(0.25, 2);
    });

    it("should return in_range=0 for impossible blend (ref outside range)", async () => {
      // Reference is brighter than foreground with black background
      // This would require alpha > 1 which is impossible
      const result = await executeWithSchema(
        "match_alpha",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 0.3; fg.g = 0.3; fg.b = 0.3;
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 0; bg.b = 0;
        variable ref: Color.SRGB;
        ref.r = 0.6; ref.g = 0.6; ref.b = 0.6;
        match_alpha(fg, bg, ref)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const inRange = list[0].value;

      // Reference is brighter than fg, can't achieve with alpha in [0,1]
      expect(inRange).toBe(0);
    });

    it("should return in_range=0 when ref is further from bg than fg (alpha > 1)", async () => {
      // From graph-engine: fg=[0,0.5,0.5], bg=[0,0,0], ref=[0,1,1]
      // The reference is twice as bright as foreground, requiring alpha > 1
      const result = await executeWithSchema(
        "match_alpha",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 0; fg.g = 0.5; fg.b = 0.5;
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 0; bg.b = 0;
        variable ref: Color.SRGB;
        ref.r = 0; ref.g = 1; ref.b = 1;
        match_alpha(fg, bg, ref)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const inRange = list[0].value;

      // Reference is brighter than foreground with black bg - alpha would need to be > 1
      expect(inRange).toBe(0);
    });

    it("should return the original foreground color unchanged", async () => {
      const result = await executeWithSchema(
        "match_alpha",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 1; fg.g = 1; fg.b = 1;
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 0; bg.b = 0;
        variable ref: Color.SRGB;
        ref.r = 0.5; ref.g = 0.5; ref.b = 0.5;
        match_alpha(fg, bg, ref)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const color = list[2];

      expect(color?.constructor.name).toBe("ColorSymbol");
      // Returns original foreground color unchanged (user applies alpha themselves)
      expect(color.value.r.value).toBe(1);
      expect(color.value.g.value).toBe(1);
      expect(color.value.b.value).toBe(1);
    });

    it("should preserve input color space (return original foreground)", async () => {
      // Returns original foreground so user can apply alpha in their working space
      const result = await executeWithSchema(
        "match_alpha",
        "function",
        `
        variable fg: Color.SRGB;
        fg.r = 1; fg.g = 0; fg.b = 0;
        variable bg: Color.SRGB;
        bg.r = 0; bg.g = 0; bg.b = 0;
        variable ref: Color.SRGB;
        ref.r = 0.5; ref.g = 0; ref.b = 0;
        match_alpha(fg, bg, ref)
        `,
      );

      expect(result?.constructor.name).toBe("ListSymbol");
      const list = (result as any).value;
      const inRange = list[0].value;
      const alpha = list[1].value;
      const color = list[2];

      // Returns original foreground unchanged (same color space as input)
      expect(color.value.r.value).toBe(1);
      expect(color.value.g.value).toBe(0);
      expect(color.value.b.value).toBe(0);
      expect(inRange).toBe(1);
      expect(alpha).toBeCloseTo(0.5, 2);
    });
  });
});
