/**
 * ColorJS Parity Testing Utilities
 *
 * This module provides tools for comparing TokenScript color conversions
 * against ColorJS as the reference implementation. It ensures our conversions
 * match ColorJS within acceptable tolerance.
 */

import Color from "colorjs.io";
import { log } from "./logger";

// ============================================================================
// Types
// ============================================================================

export interface ColorCoords {
  [key: string]: number;
}

export interface ComparisonResult {
  space: string;
  tokenScript: ColorCoords | null;
  colorJS: ColorCoords;
  matches: boolean;
  differences: Record<string, number>;
  maxDifference: number;
}

export interface RoundTripResult {
  path: string[];
  startColor: ColorCoords;
  endColor: ColorCoords | null;
  colorJSEndColor: ColorCoords;
  matches: boolean;
  accumulatedError: number;
}

export interface ConversionGraphNode {
  space: string;
  connections: string[];
}

// ============================================================================
// ColorJS Space Mappings
// ============================================================================

/**
 * Maps our schema slugs to ColorJS space IDs
 */
export const SPACE_MAPPINGS: Record<string, string> = {
  // Core spaces
  "hex-color": "srgb", // Hex is just a format of sRGB
  "rgb-color": "srgb", // RGB 0-255 maps to sRGB 0-1
  "srgb-color": "srgb",
  "srgb-linear-color": "srgb-linear",

  // XYZ spaces
  "xyz-d65-color": "xyz-d65",
  "xyz-d50-color": "xyz-d50",

  // Perceptual spaces
  "oklab-color": "oklab",
  "oklch-color": "oklch",
  "lab-color": "lab",
  "lch-color": "lch",

  // Legacy spaces
  "hsl-color": "hsl",
  "hsv-color": "hsv",
  "hwb-color": "hwb",

  // Wide gamut
  "display-p3-color": "p3",
  "linear-p3-color": "p3-linear",
  "rec2020-color": "rec2020",
  "linear-rec2020-color": "rec2020-linear",

  // HDR spaces
  "jzazbz-color": "jzazbz",
  "jzczhz-color": "jzczhz",
};

/**
 * Coordinate names for each color space
 */
export const SPACE_COORDS: Record<string, string[]> = {
  srgb: ["r", "g", "b"],
  "srgb-linear": ["r", "g", "b"],
  "xyz-d65": ["x", "y", "z"],
  "xyz-d50": ["x", "y", "z"],
  oklab: ["l", "a", "b"],
  oklch: ["l", "c", "h"],
  lab: ["l", "a", "b"],
  lch: ["l", "c", "h"],
  hsl: ["h", "s", "l"],
  hsv: ["h", "s", "v"],
  hwb: ["h", "w", "b"],
  p3: ["r", "g", "b"],
  "p3-linear": ["r", "g", "b"],
  rec2020: ["r", "g", "b"],
  "rec2020-linear": ["r", "g", "b"],
  jzazbz: ["jz", "az", "bz"],
  jzczhz: ["jz", "cz", "hz"],
};

// ============================================================================
// ColorJS Reference Functions
// ============================================================================

/**
 * Create a ColorJS color from coordinates and space
 */
export function createColorJSColor(spaceId: string, coords: number[]): Color {
  // ColorJS expects exactly 3 coords, cast to satisfy TypeScript
  return new Color(spaceId, coords as [number, number, number]);
}

/**
 * Convert a ColorJS color to another space
 */
export function convertColorJS(color: Color, targetSpace: string): ColorCoords {
  const converted = color.to(targetSpace);
  const coordNames = SPACE_COORDS[targetSpace] || ["c1", "c2", "c3"];

  const result: ColorCoords = {};
  coordNames.forEach((name, i) => {
    result[name] = converted.coords[i];
  });

  return result;
}

/**
 * Get ColorJS reference values for a color in all spaces
 */
export function getColorJSReferenceValues(
  sourceSpace: string,
  coords: number[],
): Map<string, ColorCoords> {
  const color = createColorJSColor(sourceSpace, coords);
  const results = new Map<string, ColorCoords>();

  for (const [slug, spaceId] of Object.entries(SPACE_MAPPINGS)) {
    try {
      results.set(slug, convertColorJS(color, spaceId));
    } catch (error) {
      // Some conversions might fail for out-of-gamut colors
      log.warn(`ColorJS conversion to ${spaceId} failed:`, error);
    }
  }

  return results;
}

// ============================================================================
// Comparison Functions
// ============================================================================

/**
 * Default tolerance for floating-point comparisons
 * ColorJS typically uses 1e-5 for most comparisons
 */
export const DEFAULT_TOLERANCE = 1e-5;

/**
 * Space-specific tolerances (some spaces need more tolerance due to algorithms)
 */
export const SPACE_TOLERANCES: Record<string, number> = {
  // Hue angles can have larger differences near 0/360
  hsl: 1e-3,
  hsv: 1e-3,
  hwb: 1e-3,
  oklch: 1e-3,
  lch: 1e-3,
  jzczhz: 1e-3,
  // XYZ spaces with chromatic adaptation
  "xyz-d50": 1e-4,
  // JzAzBz has complex calculations
  jzazbz: 1e-4,
};

/**
 * Compare two color coordinate objects
 */
export function compareCoords(
  actual: ColorCoords,
  expected: ColorCoords,
  tolerance: number = DEFAULT_TOLERANCE,
): { matches: boolean; differences: Record<string, number>; maxDifference: number } {
  const differences: Record<string, number> = {};
  let maxDifference = 0;

  for (const key of Object.keys(expected)) {
    const diff = Math.abs((actual[key] ?? 0) - expected[key]);
    differences[key] = diff;
    maxDifference = Math.max(maxDifference, diff);
  }

  return {
    matches: maxDifference <= tolerance,
    differences,
    maxDifference,
  };
}

/**
 * Compare TokenScript result with ColorJS reference
 */
export function compareWithColorJS(
  tokenScriptResult: ColorCoords | null,
  colorJSReference: ColorCoords,
  space: string,
): ComparisonResult {
  const tolerance = SPACE_TOLERANCES[space] ?? DEFAULT_TOLERANCE;

  if (tokenScriptResult === null) {
    return {
      space,
      tokenScript: null,
      colorJS: colorJSReference,
      matches: false,
      differences: {},
      maxDifference: Infinity,
    };
  }

  const { matches, differences, maxDifference } = compareCoords(
    tokenScriptResult,
    colorJSReference,
    tolerance,
  );

  return {
    space,
    tokenScript: tokenScriptResult,
    colorJS: colorJSReference,
    matches,
    differences,
    maxDifference,
  };
}

// ============================================================================
// Conversion Graph
// ============================================================================

/**
 * The ColorJS conversion graph structure
 * This shows which spaces can convert directly to which
 */
export const CONVERSION_GRAPH: ConversionGraphNode[] = [
  // sRGB family (gamma-encoded)
  { space: "srgb", connections: ["srgb-linear", "hsl", "hsv", "hwb"] },
  { space: "hsl", connections: ["srgb"] },
  { space: "hsv", connections: ["srgb"] },
  { space: "hwb", connections: ["srgb"] },

  // Linear sRGB (the bridge to XYZ)
  { space: "srgb-linear", connections: ["srgb", "xyz-d65"] },

  // XYZ-D65 (the main hub)
  {
    space: "xyz-d65",
    connections: ["srgb-linear", "xyz-d50", "oklab", "p3-linear", "rec2020-linear", "jzazbz"],
  },

  // XYZ-D50 (Lab connection)
  { space: "xyz-d50", connections: ["xyz-d65", "lab"] },

  // Lab family
  { space: "lab", connections: ["xyz-d50", "lch"] },
  { space: "lch", connections: ["lab"] },

  // OKLab family
  { space: "oklab", connections: ["xyz-d65", "oklch"] },
  { space: "oklch", connections: ["oklab"] },

  // Display P3 family
  { space: "p3-linear", connections: ["xyz-d65", "p3"] },
  { space: "p3", connections: ["p3-linear"] },

  // Rec.2020 family
  { space: "rec2020-linear", connections: ["xyz-d65", "rec2020"] },
  { space: "rec2020", connections: ["rec2020-linear"] },

  // JzAzBz family
  { space: "jzazbz", connections: ["xyz-d65", "jzczhz"] },
  { space: "jzczhz", connections: ["jzazbz"] },
];

/**
 * Find the shortest path between two color spaces using BFS
 */
export function findConversionPath(from: string, to: string): string[] | null {
  if (from === to) return [from];

  const graph = new Map<string, string[]>();
  for (const node of CONVERSION_GRAPH) {
    graph.set(node.space, node.connections);
  }

  const visited = new Set<string>();
  const queue: { space: string; path: string[] }[] = [{ space: from, path: [from] }];

  while (queue.length > 0) {
    const { space, path } = queue.shift()!;

    if (space === to) {
      return path;
    }

    if (visited.has(space)) continue;
    visited.add(space);

    const connections = graph.get(space) || [];
    for (const next of connections) {
      if (!visited.has(next)) {
        queue.push({ space: next, path: [...path, next] });
      }
    }
  }

  return null;
}

/**
 * Get all possible conversion paths from a space (for testing full graph)
 */
export function getAllConversionPaths(fromSpace: string): Map<string, string[]> {
  const paths = new Map<string, string[]>();

  for (const node of CONVERSION_GRAPH) {
    const path = findConversionPath(fromSpace, node.space);
    if (path) {
      paths.set(node.space, path);
    }
  }

  return paths;
}

// ============================================================================
// Round-Trip Testing
// ============================================================================

/**
 * Test a round-trip conversion: A → B → ... → A
 * Returns the accumulated error
 */
export function testRoundTrip(
  startSpace: string,
  path: string[],
  startCoords: number[],
): RoundTripResult {
  // Use ColorJS as reference
  let colorJSColor = createColorJSColor(startSpace, startCoords);

  // Track the full path including return
  const fullPath = [...path, startSpace];

  // Do the round trip in ColorJS
  for (const space of fullPath.slice(1)) {
    colorJSColor = colorJSColor.to(space);
  }

  const coordNames = SPACE_COORDS[startSpace] || ["c1", "c2", "c3"];
  const startColor: ColorCoords = {};
  const colorJSEndColor: ColorCoords = {};

  coordNames.forEach((name, i) => {
    startColor[name] = startCoords[i];
    colorJSEndColor[name] = colorJSColor.coords[i];
  });

  // Calculate accumulated error in ColorJS (this is our expected error)
  const { maxDifference } = compareCoords(startColor, colorJSEndColor, 0);

  return {
    path: fullPath,
    startColor,
    endColor: null, // Will be filled by TokenScript test
    colorJSEndColor,
    matches: maxDifference < DEFAULT_TOLERANCE,
    accumulatedError: maxDifference,
  };
}

// ============================================================================
// Test Data Generation
// ============================================================================

/**
 * Standard test colors for comprehensive testing
 */
export const TEST_COLORS = {
  // Primary colors
  red: { space: "srgb", coords: [1, 0, 0] },
  green: { space: "srgb", coords: [0, 1, 0] },
  blue: { space: "srgb", coords: [0, 0, 1] },

  // Secondary colors
  cyan: { space: "srgb", coords: [0, 1, 1] },
  magenta: { space: "srgb", coords: [1, 0, 1] },
  yellow: { space: "srgb", coords: [1, 1, 0] },

  // Neutrals
  black: { space: "srgb", coords: [0, 0, 0] },
  white: { space: "srgb", coords: [1, 1, 1] },
  gray50: { space: "srgb", coords: [0.5, 0.5, 0.5] },

  // Random test colors
  coral: { space: "srgb", coords: [1, 0.498, 0.314] },
  teal: { space: "srgb", coords: [0, 0.502, 0.502] },
  purple: { space: "srgb", coords: [0.502, 0, 0.502] },

  // Edge cases - very dark/light
  nearBlack: { space: "srgb", coords: [0.01, 0.01, 0.01] },
  nearWhite: { space: "srgb", coords: [0.99, 0.99, 0.99] },

  // Wide gamut colors (might be out of sRGB gamut)
  wideGamutGreen: { space: "p3", coords: [0, 1, 0] },
  wideGamutRed: { space: "p3", coords: [1, 0, 0] },
};

/**
 * Generate reference data for all test colors in all spaces
 */
export function generateReferenceData(): Map<
  string,
  { source: { space: string; coords: number[] }; targets: Map<string, ColorCoords> }
> {
  const referenceData = new Map();

  for (const [name, { space, coords }] of Object.entries(TEST_COLORS)) {
    const targets = getColorJSReferenceValues(space, coords);
    referenceData.set(name, {
      source: { space, coords },
      targets,
    });
  }

  return referenceData;
}

// ============================================================================
// Visualization
// ============================================================================

/**
 * Generate a Mermaid diagram of the conversion graph
 */
export function generateMermaidGraph(): string {
  const lines = ["graph TD"];

  for (const node of CONVERSION_GRAPH) {
    for (const connection of node.connections) {
      // Bidirectional arrows
      lines.push(`    ${node.space} <--> ${connection}`);
    }
  }

  // Remove duplicates (since we're adding bidirectional)
  const uniqueLines = [...new Set(lines)];

  return uniqueLines.join("\n");
}

/**
 * Generate an ASCII visualization of a conversion path
 */
export function visualizePath(path: string[]): string {
  return path.join(" → ");
}

/**
 * Generate a comparison table for console output
 */
export function formatComparisonTable(results: ComparisonResult[]): string {
  const lines: string[] = [];

  lines.push(
    "┌────────────────────┬────────────────────────────┬────────────────────────────┬────────┬───────────────┐",
  );
  lines.push(
    "│ Space              │ TokenScript                │ ColorJS                    │ Match  │ Max Diff      │",
  );
  lines.push(
    "├────────────────────┼────────────────────────────┼────────────────────────────┼────────┼───────────────┤",
  );

  for (const result of results) {
    const tsStr = result.tokenScript
      ? Object.entries(result.tokenScript)
          .map(([k, v]) => `${k}:${v.toFixed(4)}`)
          .join(" ")
      : "N/A";

    const cjsStr = Object.entries(result.colorJS)
      .map(([k, v]) => `${k}:${v.toFixed(4)}`)
      .join(" ");

    const matchStr = result.matches ? "✓" : "✗";
    const diffStr =
      result.maxDifference === Infinity ? "N/A" : result.maxDifference.toExponential(2);

    lines.push(
      `│ ${result.space.padEnd(18)} │ ${tsStr.padEnd(26)} │ ${cjsStr.padEnd(26)} │ ${matchStr.padEnd(6)} │ ${diffStr.padEnd(13)} │`,
    );
  }

  lines.push(
    "└────────────────────┴────────────────────────────┴────────────────────────────┴────────┴───────────────┘",
  );

  return lines.join("\n");
}

// ============================================================================
// Export all
// ============================================================================

export default {
  // Mappings
  SPACE_MAPPINGS,
  SPACE_COORDS,
  CONVERSION_GRAPH,
  TEST_COLORS,

  // ColorJS functions
  createColorJSColor,
  convertColorJS,
  getColorJSReferenceValues,

  // Comparison functions
  compareCoords,
  compareWithColorJS,
  DEFAULT_TOLERANCE,
  SPACE_TOLERANCES,

  // Graph functions
  findConversionPath,
  getAllConversionPaths,

  // Round-trip testing
  testRoundTrip,

  // Data generation
  generateReferenceData,

  // Visualization
  generateMermaidGraph,
  visualizePath,
  formatComparisonTable,
};
