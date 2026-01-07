/**
 * Presets command - list available bundle presets
 */

/// <reference types="../../../types/ulog" />

import anylogger from "ulog";
import { BUNDLE_PRESETS } from "@/bundler/presets/index";

const log = anylogger("presets");

/**
 * Format preset information for display
 */
function formatPresetInfo(): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("Available Bundle Presets");
  lines.push("=".repeat(60));

  for (const [key, preset] of Object.entries(BUNDLE_PRESETS)) {
    lines.push("");
    lines.push(`preset:${key}`);
    lines.push(`  ${preset.description}`);

    // Types section
    const typesCount =
      preset.types.length === 1 && preset.types[0] === "*" ? "all" : preset.types.length;
    lines.push("");
    lines.push(`  Types (${typesCount}):`);
    if (preset.types.length > 0 && preset.types[0] !== "*") {
      for (const type of preset.types) {
        lines.push(`    - ${type}`);
      }
    } else {
      lines.push(`    - all`);
    }

    // Functions section
    const functionsCount =
      preset.functions.length === 1 && preset.functions[0] === "*"
        ? "all"
        : preset.functions.length;
    lines.push("");
    lines.push(`  Functions (${functionsCount}):`);
    if (preset.functions.length > 0 && preset.functions[0] !== "*") {
      for (const func of preset.functions) {
        lines.push(`    - ${func}`);
      }
    } else {
      lines.push(`    - all`);
    }
  }

  lines.push("");
  lines.push("=".repeat(60));
  lines.push("Usage Examples:");
  lines.push("=".repeat(60));
  lines.push("npx tokenscript-schemas bundle preset:css");
  lines.push("npx tokenscript-schemas bundle preset:css type:oklab-color");
  lines.push("npx tokenscript-schemas bundle type:hex-color function:lighten");
  lines.push("");
  lines.push("Note: You can combine multiple presets and specific schemas!");

  return lines.join("\n");
}

export async function handlePresetsCommand(): Promise<void> {
  try {
    log.info("Listing available presets");

    const output = formatPresetInfo();
    console.log(output);

    log.info(`Listed ${Object.keys(BUNDLE_PRESETS).length} presets`);
  } catch (error) {
    log.error("Failed to list presets:", error);
    throw error;
  }
}
