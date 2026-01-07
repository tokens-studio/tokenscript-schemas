/**
 * CSS preset - Modern CSS color types and functions
 */

import type { BundlePreset } from "./types";

export const css: BundlePreset = {
  name: "CSS",
  description: "CSS color types",
  types: [
    "hex-color",
    "rgb-color",
    "hsl-color",
    "oklch-color",
    "oklab-color",

    // Converting colors to css strings
    "css-color",
  ],
  functions: ["lighten", "darken", "saturate", "desaturate", "mix", "invert"],
};
