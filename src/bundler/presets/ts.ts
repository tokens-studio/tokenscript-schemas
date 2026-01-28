/**
 * TS preset - Legacy color-space-specific functions
 */

import type { BundlePreset } from "./types";

export const ts: BundlePreset = {
  name: "TS",
  description:
    "Legacy color-space-specific functions (lighten, darken, mix, alpha in LCH, sRGB, P3, HSL)",
  types: ["hsl-color", "lch-color", "p3-color", "srgb-color"],
  functions: [
    "ts_alpha_hsl",
    "ts_alpha_lch",
    "ts_alpha_p3",
    "ts_alpha_srgb",
    "ts_darken_hsl",
    "ts_darken_lch",
    "ts_darken_p3",
    "ts_darken_srgb",
    "ts_lighten_hsl",
    "ts_lighten_lch",
    "ts_lighten_p3",
    "ts_lighten_srgb",
    "ts_mix_hsl",
    "ts_mix_lch",
    "ts_mix_p3",
    "ts_mix_srgb",
  ],
};
