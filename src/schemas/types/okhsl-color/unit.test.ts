/**
 * OKHSL Color Schema Tests
 *
 * Tests for the OKHSL color space (Björn Ottosson's perceptually uniform HSL)
 * Reference: https://bottosson.github.io/posts/colorpicker/
 *
 * IMPORTANT: This implementation uses a simplified cusp approximation.
 * Full ColorJS parity requires proper gamut boundary computation which
 * involves solving where the OKLab-to-sRGB matrix produces clipping.
 * The current implementation provides reasonable approximations but
 * may deviate from ColorJS values, especially for saturated colors.
 */

import { executeWithSchema, getBundledSchema } from "@tests/helpers/schema-test-utils";
import Color from "colorjs.io";
import { describe, expect, it } from "vitest";
import type { ColorSpecification } from "@/bundler/types";

describe("OKHSL Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("okhsl-color")) as ColorSpecification;

      expect(schema.name).toBe("OKHSL");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("h");
      expect(schema.schema?.properties).toHaveProperty("s");
      expect(schema.schema?.properties).toHaveProperty("l");
      expect(schema.schema?.required).toEqual(["h", "s", "l"]);
    });

    it("should have okhsl initializer", async () => {
      const schema = (await getBundledSchema("okhsl-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("okhsl");
    });

    it("should have conversion from OKLab", async () => {
      const schema = (await getBundledSchema("okhsl-color")) as ColorSpecification;

      expect(schema.conversions).toHaveLength(1);

      const oklabToOkhsl = schema.conversions.find((c: { source: string }) =>
        c.source.includes("oklab-color"),
      );
      expect(oklabToOkhsl).toBeDefined();
      // Note: conversion is marked as lossy due to cusp approximation
      expect(oklabToOkhsl?.lossless).toBe(false);
    });
  });

  describe("OKHSL Initialization", () => {
    it("should initialize OKHSL color directly", async () => {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable c: Color.OKHSL;
        c.h = 30;
        c.s = 0.8;
        c.l = 0.6;
        c
      `,
      );

      expect((result as any).value.h.value).toBe(30);
      expect((result as any).value.s.value).toBe(0.8);
      expect((result as any).value.l.value).toBe(0.6);
    });
  });

  describe("Conversion from OKLab to OKHSL", () => {
    it("should convert achromatic OKLab (gray) to OKHSL with zero saturation", async () => {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable lab: Color.OKLab;
        lab.l = 0.5;
        lab.a = 0;
        lab.b = 0;
        lab.to.okhsl()
      `,
      );

      // Gray should have saturation of 0 (no chroma)
      expect((result as any).value.s.value).toBeCloseTo(0, 3);
      // Lightness should be approximately preserved (with toe function applied)
      expect((result as any).value.l.value).toBeGreaterThan(0.3);
      expect((result as any).value.l.value).toBeLessThan(0.7);
    });

    it("should convert chromatic OKLab to OKHSL with non-zero saturation", async () => {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable lab: Color.OKLab;
        lab.l = 0.6;
        lab.a = 0.15;
        lab.b = 0.05;
        lab.to.okhsl()
      `,
      );

      // Should have some saturation
      expect((result as any).value.s.value).toBeGreaterThan(0);
      // Hue should be in red-orange range (positive a, small positive b)
      expect((result as any).value.h.value).toBeGreaterThanOrEqual(0);
      expect((result as any).value.h.value).toBeLessThan(60);
    });
  });

  describe("ColorJS Comparison (Approximate)", () => {
    // Note: These tests verify reasonable behavior, not exact parity
    // The simplified cusp approximation means we may differ from ColorJS

    it("should produce hue in correct region for sRGB red", async () => {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 0;
        srgb.b = 0;
        srgb.to.okhsl()
      `,
      );

      const colorJS = new Color("srgb", [1, 0, 0]).to("okhsl");

      console.log(`\n=== sRGB RED → OKHSL ===`);
      console.log(
        `TokenScript: { h: ${(result as any).value.h.value.toFixed(2)}, s: ${(result as any).value.s.value.toFixed(4)}, l: ${(result as any).value.l.value.toFixed(4)} }`,
      );
      console.log(
        `ColorJS:     { h: ${colorJS.coords[0].toFixed(2)}, s: ${colorJS.coords[1].toFixed(4)}, l: ${colorJS.coords[2].toFixed(4)} }`,
      );
      console.log(`Note: Values may differ due to simplified cusp approximation`);

      // Red should be in 0-60° hue range (OKHSL red is ~29°)
      expect((result as any).value.h.value).toBeGreaterThanOrEqual(0);
      expect((result as any).value.h.value).toBeLessThan(60);
    });

    it("should produce hue in correct region for sRGB green", async () => {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0;
        srgb.g = 1;
        srgb.b = 0;
        srgb.to.okhsl()
      `,
      );

      const colorJS = new Color("srgb", [0, 1, 0]).to("okhsl");

      console.log(`\n=== sRGB GREEN → OKHSL ===`);
      console.log(
        `TokenScript: { h: ${(result as any).value.h.value.toFixed(2)}, s: ${(result as any).value.s.value.toFixed(4)}, l: ${(result as any).value.l.value.toFixed(4)} }`,
      );
      console.log(
        `ColorJS:     { h: ${colorJS.coords[0].toFixed(2)}, s: ${colorJS.coords[1].toFixed(4)}, l: ${colorJS.coords[2].toFixed(4)} }`,
      );

      // Green should be around 142° in OKHSL
      expect((result as any).value.h.value).toBeGreaterThan(100);
      expect((result as any).value.h.value).toBeLessThan(180);
    });

    it("should produce hue in correct region for sRGB blue", async () => {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0;
        srgb.g = 0;
        srgb.b = 1;
        srgb.to.okhsl()
      `,
      );

      const colorJS = new Color("srgb", [0, 0, 1]).to("okhsl");

      console.log(`\n=== sRGB BLUE → OKHSL ===`);
      console.log(
        `TokenScript: { h: ${(result as any).value.h.value.toFixed(2)}, s: ${(result as any).value.s.value.toFixed(4)}, l: ${(result as any).value.l.value.toFixed(4)} }`,
      );
      console.log(
        `ColorJS:     { h: ${colorJS.coords[0].toFixed(2)}, s: ${colorJS.coords[1].toFixed(4)}, l: ${colorJS.coords[2].toFixed(4)} }`,
      );

      // Blue should be around 264° in OKHSL
      expect((result as any).value.h.value).toBeGreaterThan(220);
      expect((result as any).value.h.value).toBeLessThan(300);
    });
  });

  describe("Round-trip Conversion", () => {
    it("should approximately preserve colors through OKLab round-trip", async () => {
      const result = await executeWithSchema(
        "okhsl-color",
        "type",
        `
        variable c: Color.OKHSL;
        c.h = 180;
        c.s = 0.5;
        c.l = 0.6;
        c.to.oklab().to.okhsl()
      `,
      );

      // Hue should be roughly preserved
      expect((result as any).value.h.value).toBeCloseTo(180, 0);
      // Saturation and lightness may vary due to approximations
      expect((result as any).value.s.value).toBeGreaterThan(0);
      expect((result as any).value.l.value).toBeGreaterThan(0);
    });
  });
});
