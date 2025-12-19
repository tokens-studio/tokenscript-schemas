#!/usr/bin/env tsx
/**
 * ColorJS Comparison Tool
 *
 * This script visualizes the color space conversion graph and
 * compares ColorJS reference values with our TokenScript implementations.
 *
 * Usage:
 *   npx tsx scripts/compare-colorjs.ts [command] [options]
 *
 * Commands:
 *   graph       - Show the conversion graph
 *   reference   - Generate reference values for a color
 *   roundtrip   - Test round-trip conversions
 *   compare     - Compare TokenScript with ColorJS (when implemented)
 */

import Color from "colorjs.io";

// ============================================================================
// Configuration
// ============================================================================

const SPACES = {
  // Core
  srgb: {
    coords: ["r", "g", "b"],
    ranges: [
      [0, 1],
      [0, 1],
      [0, 1],
    ],
  },
  "srgb-linear": {
    coords: ["r", "g", "b"],
    ranges: [
      [0, 1],
      [0, 1],
      [0, 1],
    ],
  },

  // XYZ
  "xyz-d65": {
    coords: ["x", "y", "z"],
    ranges: [
      [0, 1],
      [0, 1],
      [0, 1],
    ],
  },
  "xyz-d50": {
    coords: ["x", "y", "z"],
    ranges: [
      [0, 1],
      [0, 1],
      [0, 1],
    ],
  },

  // Perceptual
  oklab: {
    coords: ["l", "a", "b"],
    ranges: [
      [0, 1],
      [-0.4, 0.4],
      [-0.4, 0.4],
    ],
  },
  oklch: {
    coords: ["l", "c", "h"],
    ranges: [
      [0, 1],
      [0, 0.4],
      [0, 360],
    ],
  },
  lab: {
    coords: ["l", "a", "b"],
    ranges: [
      [0, 100],
      [-125, 125],
      [-125, 125],
    ],
  },
  lch: {
    coords: ["l", "c", "h"],
    ranges: [
      [0, 100],
      [0, 150],
      [0, 360],
    ],
  },

  // Legacy
  hsl: {
    coords: ["h", "s", "l"],
    ranges: [
      [0, 360],
      [0, 100],
      [0, 100],
    ],
  },
  hsv: {
    coords: ["h", "s", "v"],
    ranges: [
      [0, 360],
      [0, 100],
      [0, 100],
    ],
  },
  hwb: {
    coords: ["h", "w", "b"],
    ranges: [
      [0, 360],
      [0, 100],
      [0, 100],
    ],
  },

  // Wide gamut
  p3: {
    coords: ["r", "g", "b"],
    ranges: [
      [0, 1],
      [0, 1],
      [0, 1],
    ],
  },
  "p3-linear": {
    coords: ["r", "g", "b"],
    ranges: [
      [0, 1],
      [0, 1],
      [0, 1],
    ],
  },
  rec2020: {
    coords: ["r", "g", "b"],
    ranges: [
      [0, 1],
      [0, 1],
      [0, 1],
    ],
  },
  "rec2020-linear": {
    coords: ["r", "g", "b"],
    ranges: [
      [0, 1],
      [0, 1],
      [0, 1],
    ],
  },

  // HDR
  jzazbz: {
    coords: ["jz", "az", "bz"],
    ranges: [
      [0, 1],
      [-0.5, 0.5],
      [-0.5, 0.5],
    ],
  },
  jzczhz: {
    coords: ["jz", "cz", "hz"],
    ranges: [
      [0, 1],
      [0, 0.5],
      [0, 360],
    ],
  },
} as const;

const CONVERSION_GRAPH = {
  srgb: ["srgb-linear", "hsl", "hsv", "hwb"],
  "srgb-linear": ["srgb", "xyz-d65"],
  "xyz-d65": ["srgb-linear", "xyz-d50", "oklab", "p3-linear", "rec2020-linear", "jzazbz"],
  "xyz-d50": ["xyz-d65", "lab"],
  oklab: ["xyz-d65", "oklch"],
  oklch: ["oklab"],
  lab: ["xyz-d50", "lch"],
  lch: ["lab"],
  hsl: ["srgb"],
  hsv: ["srgb"],
  hwb: ["srgb"],
  p3: ["p3-linear"],
  "p3-linear": ["xyz-d65", "p3"],
  rec2020: ["rec2020-linear"],
  "rec2020-linear": ["xyz-d65", "rec2020"],
  jzazbz: ["xyz-d65", "jzczhz"],
  jzczhz: ["jzazbz"],
};

// ============================================================================
// Utility Functions
// ============================================================================

function formatCoords(coords: number[], names: readonly string[]): string {
  return names.map((name, i) => `${name}: ${coords[i].toFixed(6)}`).join(", ");
}

function formatCoordsShort(coords: number[]): string {
  return `[${coords.map((c) => c.toFixed(4)).join(", ")}]`;
}

// ============================================================================
// Commands
// ============================================================================

function showGraph(): void {
  console.log("\n╔══════════════════════════════════════════════════════════════════╗");
  console.log("║           COLOR SPACE CONVERSION GRAPH                           ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  console.log("                              ┌─────────┐");
  console.log("                              │   Hex   │");
  console.log("                              │  (RGB)  │");
  console.log("                              └────┬────┘");
  console.log("                                   │");
  console.log("    ┌─────┐    ┌─────┐    ┌────────▼────────┐    ┌─────┐    ┌─────┐");
  console.log("    │ HSL │◄──►│     │◄──►│      sRGB       │◄──►│     │◄──►│ HWB │");
  console.log("    └─────┘    │ HSV │    │   (0-1 range)   │    │ HSV │    └─────┘");
  console.log("               └─────┘    └────────┬────────┘    └─────┘");
  console.log("                                   │ gamma");
  console.log("                          ┌────────▼────────┐");
  console.log("                          │   Linear sRGB   │");
  console.log("                          └────────┬────────┘");
  console.log("                                   │ matrix");
  console.log("    ┌──────────────────────────────┼──────────────────────────────┐");
  console.log("    │                              │                              │");
  console.log("    ▼                              ▼                              ▼");
  console.log("┌────────┐                  ┌─────────────┐                ┌────────────┐");
  console.log("│ Linear │                  │   XYZ-D65   │                │  Linear    │");
  console.log("│   P3   │                  │    (HUB)    │                │  Rec.2020  │");
  console.log("└───┬────┘                  └──────┬──────┘                └─────┬──────┘");
  console.log("    │ gamma                        │                            │ gamma");
  console.log("┌───▼────┐         ┌───────────────┼───────────────┐      ┌─────▼──────┐");
  console.log("│Display │         │               │               │      │  Rec.2020  │");
  console.log("│   P3   │         ▼               ▼               ▼      └────────────┘");
  console.log("└────────┘   ┌──────────┐    ┌──────────┐    ┌──────────┐");
  console.log("             │ XYZ-D50  │    │  OKLab   │    │ JzAzBz   │");
  console.log("             │(Bradford)│    └────┬─────┘    └────┬─────┘");
  console.log("             └────┬─────┘         │               │");
  console.log("                  │               ▼               ▼");
  console.log("                  ▼          ┌──────────┐    ┌──────────┐");
  console.log("             ┌──────────┐    │  OKLCH   │    │  JzCzHz  │");
  console.log("             │   Lab    │    │ (polar)  │    │  (polar) │");
  console.log("             └────┬─────┘    └──────────┘    └──────────┘");
  console.log("                  │");
  console.log("                  ▼");
  console.log("             ┌──────────┐");
  console.log("             │   LCH    │");
  console.log("             │ (polar)  │");
  console.log("             └──────────┘");
  console.log("");

  console.log("\n📊 Mermaid Diagram (copy to visualize):\n");
  console.log("```mermaid");
  console.log("graph TD");
  console.log("    subgraph Legacy[Legacy Spaces]");
  console.log("        HSL <==> sRGB");
  console.log("        HSV <==> sRGB");
  console.log("        HWB <==> sRGB");
  console.log("    end");
  console.log("    ");
  console.log("    subgraph Core[Core Pipeline]");
  console.log("        sRGB <==> sRGB-Linear");
  console.log("        sRGB-Linear <==> XYZ-D65");
  console.log("    end");
  console.log("    ");
  console.log("    subgraph Perceptual[Perceptual Spaces]");
  console.log("        XYZ-D65 <==> OKLab");
  console.log("        OKLab <==> OKLCH");
  console.log("        XYZ-D65 <==> XYZ-D50");
  console.log("        XYZ-D50 <==> Lab");
  console.log("        Lab <==> LCH");
  console.log("    end");
  console.log("    ");
  console.log("    subgraph WideGamut[Wide Gamut]");
  console.log("        XYZ-D65 <==> P3-Linear");
  console.log("        P3-Linear <==> P3");
  console.log("        XYZ-D65 <==> Rec2020-Linear");
  console.log("        Rec2020-Linear <==> Rec2020");
  console.log("    end");
  console.log("    ");
  console.log("    subgraph HDR[HDR Spaces]");
  console.log("        XYZ-D65 <==> JzAzBz");
  console.log("        JzAzBz <==> JzCzHz");
  console.log("    end");
  console.log("```\n");
}

function generateReference(colorInput: string): void {
  console.log("\n╔══════════════════════════════════════════════════════════════════╗");
  console.log("║           COLORJS REFERENCE VALUES                               ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  let color: Color;
  try {
    color = new Color(colorInput);
  } catch {
    console.error(`❌ Invalid color: ${colorInput}`);
    console.log("\nExamples:");
    console.log("  npx tsx scripts/compare-colorjs.ts reference '#ff5733'");
    console.log("  npx tsx scripts/compare-colorjs.ts reference 'oklch(70% 0.15 30)'");
    console.log("  npx tsx scripts/compare-colorjs.ts reference 'red'");
    return;
  }

  console.log(`🎨 Input: ${colorInput}`);
  console.log(`   Parsed as: ${color.spaceId} ${formatCoordsShort(color.coords)}\n`);

  console.log("┌────────────────────┬─────────────────────────────────────────────────┐");
  console.log("│ Color Space        │ Coordinates                                     │");
  console.log("├────────────────────┼─────────────────────────────────────────────────┤");

  for (const [spaceId, config] of Object.entries(SPACES)) {
    try {
      const converted = color.to(spaceId);
      const formatted = formatCoords(converted.coords, config.coords);
      console.log(`│ ${spaceId.padEnd(18)} │ ${formatted.padEnd(47)} │`);
    } catch {
      console.log(`│ ${spaceId.padEnd(18)} │ ${"[conversion failed]".padEnd(47)} │`);
    }
  }

  console.log("└────────────────────┴─────────────────────────────────────────────────┘\n");

  // Show the path that would be taken
  const targetSpace = "oklch"; // Example target
  console.log(`\n🔗 Example conversion path (sRGB → ${targetSpace}):`);
  const path = findPath("srgb", targetSpace);
  if (path) {
    console.log(`   ${path.join(" → ")}\n`);
  }
}

function findPath(from: string, to: string): string[] | null {
  if (from === to) return [from];

  const visited = new Set<string>();
  const queue: { space: string; path: string[] }[] = [{ space: from, path: [from] }];

  while (queue.length > 0) {
    const { space, path } = queue.shift()!;
    if (space === to) return path;
    if (visited.has(space)) continue;
    visited.add(space);

    const connections = CONVERSION_GRAPH[space as keyof typeof CONVERSION_GRAPH] || [];
    for (const next of connections) {
      if (!visited.has(next)) {
        queue.push({ space: next, path: [...path, next] });
      }
    }
  }

  return null;
}

function testRoundTrip(colorInput: string): void {
  console.log("\n╔══════════════════════════════════════════════════════════════════╗");
  console.log("║           ROUND-TRIP PRECISION TEST                              ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  let color: Color;
  try {
    color = new Color(colorInput);
  } catch {
    console.error(`❌ Invalid color: ${colorInput}`);
    return;
  }

  const srgb = color.to("srgb");
  const original: [number, number, number] = [srgb.coords[0], srgb.coords[1], srgb.coords[2]];

  console.log(`🎨 Original sRGB: ${formatCoordsShort(original)}\n`);

  // Define round-trip paths to test
  const roundTrips = [
    ["srgb", "srgb-linear", "srgb"],
    ["srgb", "srgb-linear", "xyz-d65", "srgb-linear", "srgb"],
    ["srgb", "srgb-linear", "xyz-d65", "oklab", "xyz-d65", "srgb-linear", "srgb"],
    ["srgb", "srgb-linear", "xyz-d65", "oklab", "oklch", "oklab", "xyz-d65", "srgb-linear", "srgb"],
    [
      "srgb",
      "srgb-linear",
      "xyz-d65",
      "xyz-d50",
      "lab",
      "lch",
      "lab",
      "xyz-d50",
      "xyz-d65",
      "srgb-linear",
      "srgb",
    ],
    ["srgb", "hsl", "srgb"],
    ["srgb", "hsv", "srgb"],
    ["srgb", "hwb", "srgb"],
  ];

  console.log(
    "┌─────────────────────────────────────────────────────────────┬─────────────────────┬──────────────┐",
  );
  console.log(
    "│ Round-trip Path                                             │ Result              │ Max Error    │",
  );
  console.log(
    "├─────────────────────────────────────────────────────────────┼─────────────────────┼──────────────┤",
  );

  for (const path of roundTrips) {
    let current = new Color("srgb", original);

    // Follow the path
    for (let i = 1; i < path.length; i++) {
      current = current.to(path[i]);
    }

    const result = current.coords;
    const errors = original.map((o, i) => Math.abs(o - result[i]));
    const maxError = Math.max(...errors);

    const pathStr = path.join(" → ");
    const resultStr = formatCoordsShort(result);
    const errorStr = maxError < 1e-10 ? "< 1e-10" : maxError.toExponential(2);
    const status = maxError < 1e-5 ? "✓" : "⚠";

    console.log(
      `│ ${pathStr.padEnd(59)} │ ${resultStr.padEnd(19)} │ ${status} ${errorStr.padEnd(10)} │`,
    );
  }

  console.log(
    "└─────────────────────────────────────────────────────────────┴─────────────────────┴──────────────┘\n",
  );

  console.log("Legend:");
  console.log("  ✓ = Error < 1e-5 (acceptable)");
  console.log("  ⚠ = Error >= 1e-5 (needs investigation)\n");
}

function showAllConversions(): void {
  console.log("\n╔══════════════════════════════════════════════════════════════════╗");
  console.log("║           ALL COLOR CONVERSIONS MATRIX                           ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  // Test color: a mid-saturation color that exercises all paths well
  const testColor = new Color("srgb", [0.7, 0.3, 0.5]);

  console.log(`Test color: sRGB [0.7, 0.3, 0.5] (a pinkish-purple)\n`);

  const spaceList = Object.keys(SPACES);

  // Header
  console.log("FROM \\ TO".padEnd(16) + spaceList.map((s) => s.slice(0, 10).padEnd(12)).join(""));
  console.log("─".repeat(16 + spaceList.length * 12));

  for (const fromSpace of spaceList) {
    let row = fromSpace.padEnd(16);

    const fromColor = testColor.to(fromSpace);

    for (const toSpace of spaceList) {
      if (fromSpace === toSpace) {
        row += "   ──────   ";
      } else {
        try {
          const toColor = fromColor.to(toSpace);
          // Just show first coordinate as indicator
          row += toColor.coords[0].toFixed(4).padEnd(12);
        } catch {
          row += "   FAIL     ";
        }
      }
    }

    console.log(row);
  }

  console.log("\n(Showing first coordinate of each conversion result)\n");
}

// ============================================================================
// Main
// ============================================================================

const command = process.argv[2] || "help";
const arg = process.argv[3];

switch (command) {
  case "graph":
    showGraph();
    break;
  case "reference":
    generateReference(arg || "oklch(70% 0.15 30)");
    break;
  case "roundtrip":
    testRoundTrip(arg || "#ff5733");
    break;
  case "matrix":
    showAllConversions();
    break;
  default:
    console.log(`
ColorJS Comparison Tool
=======================

Commands:
  graph              Show the conversion graph
  reference <color>  Generate reference values for a color
  roundtrip <color>  Test round-trip conversion precision
  matrix             Show all-to-all conversion matrix

Examples:
  npx tsx scripts/compare-colorjs.ts graph
  npx tsx scripts/compare-colorjs.ts reference '#ff5733'
  npx tsx scripts/compare-colorjs.ts reference 'oklch(70% 0.15 30)'
  npx tsx scripts/compare-colorjs.ts roundtrip '#ff5733'
  npx tsx scripts/compare-colorjs.ts matrix
`);
}
