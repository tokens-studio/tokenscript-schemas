/**
 * Bundle presets - predefined sets of schemas for common use cases
 */

import { css } from "./css";
import { full } from "./full";
import type { BundlePreset } from "./types";

export type { BundlePreset };

/**
 * Available bundle presets
 */
export const BUNDLE_PRESETS: Record<string, BundlePreset> = {
  css,
  full,
};

/**
 * Expand schemas, replacing "preset:name" with actual schema list
 */
export function expandPresetSchemas(schemas: string[]): string[] {
  const expanded: string[] = [];

  for (const schema of schemas) {
    if (schema.startsWith("preset:")) {
      const presetName = schema.slice(7); // Remove "preset:"
      const preset = BUNDLE_PRESETS[presetName];

      if (preset) {
        // Add all types from preset
        for (const type of preset.types) {
          expanded.push(type === "*" ? "*" : `type:${type}`);
        }
        // Add all functions from preset
        for (const func of preset.functions) {
          expanded.push(func === "*" ? "*" : `function:${func}`);
        }
      } else {
        console.warn(`⚠ Unknown preset: ${presetName}`);
      }
    } else {
      // Not a preset, keep as-is
      expanded.push(schema);
    }
  }

  return expanded;
}
