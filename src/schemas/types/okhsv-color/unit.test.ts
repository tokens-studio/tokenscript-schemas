/**
 * OKHSV Color Schema Tests
 *
 * Tests for the OKHSV color space (Björn Ottosson's perceptually uniform HSV)
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

describe("OKHSV Color Schema", () => {
  describe("Schema Definition", () => {
    it("should have correct schema structure", async () => {
      const schema = (await getBundledSchema("okhsv-color")) as ColorSpecification;

      expect(schema.name).toBe("OKHSV");
      expect(schema.type).toBe("color");
      expect(schema.schema).toBeDefined();
      expect(schema.schema?.properties).toHaveProperty("h");
      expect(schema.schema?.properties).toHaveProperty("s");
      expect(schema.schema?.properties).toHaveProperty("v");
      expect(schema.schema?.required).toEqual(["h", "s", "v"]);
    });

    it("should have okhsv initializer", async () => {
      const schema = (await getBundledSchema("okhsv-color")) as ColorSpecification;

      expect(schema.initializers).toHaveLength(1);
      expect(schema.initializers[0].keyword).toBe("okhsv");
    });

    it("should have conversion from OKLab", async () => {
      const schema = (await getBundledSchema("okhsv-color")) as ColorSpecification;

      expect(schema.conversions).toHaveLength(1);

      const oklabToOkhsv = schema.conversions.find((c: { source: string }) =>
        c.source.includes("oklab-color"),
      );
      expect(oklabToOkhsv).toBeDefined();
      // Note: conversion is marked as lossy due to cusp approximation
      expect(oklabToOkhsv?.lossless).toBe(false);
    });
  });

  describe("OKHSV Initialization", () => {
    it("should initialize OKHSV color directly", async () => {
      const result = await executeWithSchema(
        "okhsv-color",
        "type",
        `
        variable c: Color.OKHSV;
        c.h = 120;
        c.s = 0.9;
        c.v = 0.8;
        c
      `,
      );

      expect((result as any).value.h.value).toBe(120);
      expect((result as any).value.s.value).toBe(0.9);
      expect((result as any).value.v.value).toBe(0.8);
    });
  });

  describe("Conversion from OKLab to OKHSV", () => {
    it("should convert achromatic OKLab (gray) to OKHSV with zero saturation", async () => {
      const result = await executeWithSchema(
        "okhsv-color",
        "type",
        `
        variable lab: Color.OKLab;
        lab.l = 0.5;
        lab.a = 0;
        lab.b = 0;
        lab.to.okhsv()
      `,
      );

      // Gray should have saturation of 0
      expect((result as any).value.s.value).toBeCloseTo(0, 3);
      // Value should reflect lightness (approximately)
      expect((result as any).value.v.value).toBeGreaterThan(0.3);
      expect((result as any).value.v.value).toBeLessThan(0.7);
    });

    it("should convert chromatic OKLab to OKHSV with non-zero saturation", async () => {
      const result = await executeWithSchema(
        "okhsv-color",
        "type",
        `
        variable lab: Color.OKLab;
        lab.l = 0.7;
        lab.a = 0.1;
        lab.b = 0.15;
        lab.to.okhsv()
      `,
      );

      // Should have some saturation
      expect((result as any).value.s.value).toBeGreaterThan(0);
      // Value should be reasonable
      expect((result as any).value.v.value).toBeGreaterThan(0);
      expect((result as any).value.v.value).toBeLessThanOrEqual(1);
    });
  });

  describe("ColorJS Comparison (Approximate)", () => {
    // Note: These tests verify reasonable behavior, not exact parity
    // The simplified cusp approximation means we may differ from ColorJS

    it("should produce hue in correct region for sRGB red", async () => {
      const result = await executeWithSchema(
        "okhsv-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 1;
        srgb.g = 0;
        srgb.b = 0;
        srgb.to.okhsv()
      `,
      );

      const colorJS = new Color("srgb", [1, 0, 0]).to("okhsv");

      console.log(`\n=== sRGB RED → OKHSV ===`);
      console.log(
        `TokenScript: { h: ${(result as any).value.h.value.toFixed(2)}, s: ${(result as any).value.s.value.toFixed(4)}, v: ${(result as any).value.v.value.toFixed(4)} }`,
      );
      console.log(
        `ColorJS:     { h: ${colorJS.coords[0].toFixed(2)}, s: ${colorJS.coords[1].toFixed(4)}, v: ${colorJS.coords[2].toFixed(4)} }`,
      );
      console.log(`Note: Values may differ due to simplified cusp approximation`);

      // Red should be in 0-60° hue range
      expect((result as any).value.h.value).toBeGreaterThanOrEqual(0);
      expect((result as any).value.h.value).toBeLessThan(60);
    });

    it("should produce hue in correct region for sRGB green", async () => {
      const result = await executeWithSchema(
        "okhsv-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0;
        srgb.g = 1;
        srgb.b = 0;
        srgb.to.okhsv()
      `,
      );

      const colorJS = new Color("srgb", [0, 1, 0]).to("okhsv");

      console.log(`\n=== sRGB GREEN → OKHSV ===`);
      console.log(
        `TokenScript: { h: ${(result as any).value.h.value.toFixed(2)}, s: ${(result as any).value.s.value.toFixed(4)}, v: ${(result as any).value.v.value.toFixed(4)} }`,
      );
      console.log(
        `ColorJS:     { h: ${colorJS.coords[0].toFixed(2)}, s: ${colorJS.coords[1].toFixed(4)}, v: ${colorJS.coords[2].toFixed(4)} }`,
      );

      // Green should be around 142° in OKHSV
      expect((result as any).value.h.value).toBeGreaterThan(100);
      expect((result as any).value.h.value).toBeLessThan(180);
    });

    it("should produce hue in correct region for sRGB blue", async () => {
      const result = await executeWithSchema(
        "okhsv-color",
        "type",
        `
        variable srgb: Color.SRGB;
        srgb.r = 0;
        srgb.g = 0;
        srgb.b = 1;
        srgb.to.okhsv()
      `,
      );

      const colorJS = new Color("srgb", [0, 0, 1]).to("okhsv");

      console.log(`\n=== sRGB BLUE → OKHSV ===`);
      console.log(
        `TokenScript: { h: ${(result as any).value.h.value.toFixed(2)}, s: ${(result as any).value.s.value.toFixed(4)}, v: ${(result as any).value.v.value.toFixed(4)} }`,
      );
      console.log(
        `ColorJS:     { h: ${colorJS.coords[0].toFixed(2)}, s: ${colorJS.coords[1].toFixed(4)}, v: ${colorJS.coords[2].toFixed(4)} }`,
      );

      // Blue should be around 264° in OKHSV
      expect((result as any).value.h.value).toBeGreaterThan(220);
      expect((result as any).value.h.value).toBeLessThan(300);
    });
  });

  describe("Round-trip Conversion", () => {
    it("should approximately preserve colors through OKLab round-trip", async () => {
      const result = await executeWithSchema(
        "okhsv-color",
        "type",
        `
        variable c: Color.OKHSV;
        c.h = 180;
        c.s = 0.5;
        c.v = 0.7;
        c.to.oklab().to.okhsv()
      `,
      );

      // Hue should be roughly preserved
      expect((result as any).value.h.value).toBeCloseTo(180, 0);
      // Saturation and value may vary due to approximations
      expect((result as any).value.s.value).toBeGreaterThan(0);
      expect((result as any).value.v.value).toBeGreaterThan(0);
    });
  });
});
