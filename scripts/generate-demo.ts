/**
 * Visual Color Parity Demo Generator
 *
 * Generates an HTML page (`demo/color-comparison.html`) that provides
 * side-by-side visual comparison of TokenScript color conversions
 * against the ColorJS reference implementation.
 *
 * Features:
 * - Converts test colors through 11 color spaces (sRGB, Linear sRGB, XYZ-D65, etc.)
 * - Shows color swatches from both TokenScript and ColorJS
 * - Displays numerical coordinate values with max difference calculation
 * - Exports test results as copyable CSV
 * - Handles achromatic colors (NaN hue) specially
 *
 * Output: demo/color-comparison.html
 *
 * Usage:
 *   npx tsx scripts/generate-demo.ts
 *
 * @module scripts/generate-demo
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Color from "colorjs.io";
import { executeWithSchema } from "../tests/helpers/schema-test-utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ConversionResult {
  space: string;
  displayName: string;
  conversionPath: string; // The actual conversion chain
  cssSupported: boolean;
  tokenScript: { coords: number[]; css: string | null };
  colorJS: { coords: number[]; css: string | null };
  match: boolean;
  maxDiff: number;
  nanMismatch: boolean; // TokenScript has value, ColorJS has NaN (achromatic hue)
}

interface ColorResult {
  name: string;
  inputRGB: [number, number, number];
  inputHex: string;
  conversions: ConversionResult[];
}

// Test colors
const testColors: { name: string; rgb: [number, number, number] }[] = [
  { name: "Red", rgb: [255, 0, 0] },
  { name: "Green", rgb: [0, 255, 0] },
  { name: "Blue", rgb: [0, 0, 255] },
  { name: "Cyan", rgb: [0, 255, 255] },
  { name: "Magenta", rgb: [255, 0, 255] },
  { name: "Yellow", rgb: [255, 255, 0] },
  { name: "Orange", rgb: [255, 165, 0] },
  { name: "Coral", rgb: [255, 127, 80] },
  { name: "Teal", rgb: [0, 128, 128] },
  { name: "Purple", rgb: [128, 0, 128] },
  { name: "White", rgb: [255, 255, 255] },
  { name: "Black", rgb: [0, 0, 0] },
  { name: "Gray 50%", rgb: [128, 128, 128] },
];

// Color spaces to test with conversion paths
const colorSpaces = [
  {
    id: "srgb",
    tsId: "srgb",
    displayName: "sRGB",
    coords: ["r", "g", "b"],
    cssSupported: true,
    conversionPath: "RGB → sRGB (÷255)",
  },
  {
    id: "srgb-linear",
    tsId: "srgb-linear",
    displayName: "Linear sRGB",
    coords: ["r", "g", "b"],
    cssSupported: true,
    conversionPath: "sRGB → Linear (gamma decode)",
  },
  {
    id: "xyz-d65",
    tsId: "xyz-d65",
    displayName: "XYZ-D65",
    coords: ["x", "y", "z"],
    cssSupported: true,
    conversionPath: "Linear sRGB → XYZ-D65 (matrix)",
  },
  {
    id: "oklab",
    tsId: "oklab",
    displayName: "OKLab",
    coords: ["l", "a", "b"],
    cssSupported: true,
    conversionPath: "XYZ-D65 → OKLab (LMS cone response)",
  },
  {
    id: "oklch",
    tsId: "oklch",
    displayName: "OKLCH",
    coords: ["l", "c", "h"],
    cssSupported: true,
    conversionPath: "OKLab → OKLCH (cartesian to polar)",
  },
  {
    id: "xyz-d50",
    tsId: "xyz-d50",
    displayName: "XYZ-D50",
    coords: ["x", "y", "z"],
    cssSupported: true,
    conversionPath: "XYZ-D65 → XYZ-D50 (Bradford)",
  },
  {
    id: "lab",
    tsId: "lab",
    displayName: "CIE Lab",
    coords: ["l", "a", "b"],
    cssSupported: true,
    conversionPath: "XYZ-D50 → Lab (perceptual)",
  },
  {
    id: "lch",
    tsId: "lch",
    displayName: "CIE LCH",
    coords: ["l", "c", "h"],
    cssSupported: true,
    conversionPath: "Lab → LCH (cartesian to polar)",
  },
  {
    id: "hsl",
    tsId: "hsl",
    displayName: "HSL",
    coords: ["h", "s", "l"],
    cssSupported: true,
    conversionPath: "sRGB → HSL (cylindrical)",
  },
  {
    id: "hsv",
    tsId: "hsv",
    displayName: "HSV",
    coords: ["h", "s", "v"],
    cssSupported: false, // HSV is not in CSS Color Level 4
    conversionPath: "sRGB → HSV (cylindrical)",
  },
  {
    id: "hwb",
    tsId: "hwb",
    displayName: "HWB",
    coords: ["h", "w", "b"],
    cssSupported: true,
    conversionPath: "HSV → HWB (whiteness/blackness)",
  },
];

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

// Generate CSS color string from coordinates
function toCssColor(space: (typeof colorSpaces)[0], coords: number[]): string | null {
  if (!space.cssSupported) return null;

  // Handle NaN values - can't display
  if (coords.some((v) => v !== 0 && Number.isNaN(v))) return null;

  const [c0, c1, c2] = coords;

  switch (space.id) {
    case "srgb":
      return `color(srgb ${c0.toFixed(4)} ${c1.toFixed(4)} ${c2.toFixed(4)})`;
    case "srgb-linear":
      return `color(srgb-linear ${c0.toFixed(4)} ${c1.toFixed(4)} ${c2.toFixed(4)})`;
    case "xyz-d65":
      return `color(xyz-d65 ${c0.toFixed(4)} ${c1.toFixed(4)} ${c2.toFixed(4)})`;
    case "xyz-d50":
      return `color(xyz-d50 ${c0.toFixed(4)} ${c1.toFixed(4)} ${c2.toFixed(4)})`;
    case "oklab":
      // oklab(L a b) where L is 0-1
      return `oklab(${c0.toFixed(4)} ${c1.toFixed(4)} ${c2.toFixed(4)})`;
    case "oklch": {
      // oklch(L C H) where L is 0-1, C is chroma, H is hue in degrees
      // coords are [l, c, h]
      const oklchH = Number.isNaN(c2) ? 0 : c2;
      return `oklch(${c0.toFixed(4)} ${c1.toFixed(4)} ${oklchH.toFixed(2)})`;
    }
    case "lab":
      // lab(L a b) where L is 0-100
      return `lab(${c0.toFixed(2)} ${c1.toFixed(4)} ${c2.toFixed(4)})`;
    case "lch": {
      // lch(L C H) where L is 0-100, C is chroma, H is hue in degrees
      // coords are [l, c, h]
      const lchH = Number.isNaN(c2) ? 0 : c2;
      return `lch(${c0.toFixed(2)} ${c1.toFixed(4)} ${lchH.toFixed(2)})`;
    }
    case "hsl": {
      // hsl(H S L) where H is degrees, S and L are 0-1 (we store as 0-1)
      const hslH = Number.isNaN(c0) ? 0 : c0;
      return `hsl(${hslH.toFixed(1)} ${(c1 * 100).toFixed(1)}% ${(c2 * 100).toFixed(1)}%)`;
    }
    case "hwb": {
      // hwb(H W B) where H is degrees, W and B are 0-1 (we store as 0-1)
      const hwbH = Number.isNaN(c0) ? 0 : c0;
      return `hwb(${hwbH.toFixed(1)} ${(c1 * 100).toFixed(1)}% ${(c2 * 100).toFixed(1)}%)`;
    }
    default:
      return null;
  }
}

async function runConversion(
  rgb: [number, number, number],
  space: (typeof colorSpaces)[0],
): Promise<ConversionResult> {
  const [r, g, b] = rgb;
  const srgb: [number, number, number] = [r / 255, g / 255, b / 255];

  let tsCoords: number[] = [NaN, NaN, NaN];
  let cjCoords: number[] = [NaN, NaN, NaN];
  let maxDiff = 0;
  let nanMismatch = false;

  try {
    // ColorJS conversion first (always works)
    const cjColor = new Color("srgb", srgb).to(space.id);
    cjCoords = [...cjColor.coords];

    // Normalize HSL/HSV/HWB from 0-100 to 0-1 for S/L/V/W/B
    if (space.id === "hsl" || space.id === "hsv" || space.id === "hwb") {
      cjCoords[1] = cjCoords[1] / 100;
      cjCoords[2] = cjCoords[2] / 100;
    }

    // TokenScript conversion
    let tsCode = "";
    let tsResult: any;

    if (space.tsId === "srgb") {
      tsCode = `
        variable rgb: Color.Rgb;
        rgb.r = ${r}; rgb.g = ${g}; rgb.b = ${b};
        rgb.to.srgb()
      `;
      tsResult = await executeWithSchema("srgb-color", "type", tsCode);
    } else if (space.tsId === "srgb-linear") {
      tsCode = `
        variable srgb: Color.SRGB;
        srgb.r = ${srgb[0]}; srgb.g = ${srgb[1]}; srgb.b = ${srgb[2]};
        srgb.to.linearsrgb()
      `;
      tsResult = await executeWithSchema("srgb-linear-color", "type", tsCode);
    } else if (space.tsId === "xyz-d65") {
      tsCode = `
        variable srgb: Color.SRGB;
        srgb.r = ${srgb[0]}; srgb.g = ${srgb[1]}; srgb.b = ${srgb[2]};
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        linear.to.xyzd65()
      `;
      tsResult = await executeWithSchema("xyz-d65-color", "type", tsCode);
    } else if (space.tsId === "oklab") {
      tsCode = `
        variable srgb: Color.SRGB;
        srgb.r = ${srgb[0]}; srgb.g = ${srgb[1]}; srgb.b = ${srgb[2]};
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz: Color.XYZD65 = linear.to.xyzd65();
        xyz.to.oklab()
      `;
      tsResult = await executeWithSchema("oklab-color", "type", tsCode);
    } else if (space.tsId === "oklch") {
      tsCode = `
        variable srgb: Color.SRGB;
        srgb.r = ${srgb[0]}; srgb.g = ${srgb[1]}; srgb.b = ${srgb[2]};
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz: Color.XYZD65 = linear.to.xyzd65();
        variable lab: Color.OKLab = xyz.to.oklab();
        lab.to.oklch()
      `;
      tsResult = await executeWithSchema("oklch-color", "type", tsCode);
    } else if (space.tsId === "xyz-d50") {
      tsCode = `
        variable srgb: Color.SRGB;
        srgb.r = ${srgb[0]}; srgb.g = ${srgb[1]}; srgb.b = ${srgb[2]};
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz65: Color.XYZD65 = linear.to.xyzd65();
        xyz65.to.xyzd50()
      `;
      tsResult = await executeWithSchema("xyz-d50-color", "type", tsCode);
    } else if (space.tsId === "lab") {
      tsCode = `
        variable srgb: Color.SRGB;
        srgb.r = ${srgb[0]}; srgb.g = ${srgb[1]}; srgb.b = ${srgb[2]};
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz65: Color.XYZD65 = linear.to.xyzd65();
        variable xyz50: Color.XYZD50 = xyz65.to.xyzd50();
        xyz50.to.lab()
      `;
      tsResult = await executeWithSchema("lab-color", "type", tsCode);
    } else if (space.tsId === "lch") {
      tsCode = `
        variable srgb: Color.SRGB;
        srgb.r = ${srgb[0]}; srgb.g = ${srgb[1]}; srgb.b = ${srgb[2]};
        variable linear: Color.LinearSRGB = srgb.to.linearsrgb();
        variable xyz65: Color.XYZD65 = linear.to.xyzd65();
        variable xyz50: Color.XYZD50 = xyz65.to.xyzd50();
        variable lab: Color.Lab = xyz50.to.lab();
        lab.to.lch()
      `;
      tsResult = await executeWithSchema("lch-color", "type", tsCode);
    } else if (space.tsId === "hsl") {
      tsCode = `
        variable srgb: Color.SRGB;
        srgb.r = ${srgb[0]}; srgb.g = ${srgb[1]}; srgb.b = ${srgb[2]};
        srgb.to.hsl()
      `;
      tsResult = await executeWithSchema("hsl-color", "type", tsCode);
    } else if (space.tsId === "hsv") {
      tsCode = `
        variable srgb: Color.SRGB;
        srgb.r = ${srgb[0]}; srgb.g = ${srgb[1]}; srgb.b = ${srgb[2]};
        srgb.to.hsv()
      `;
      tsResult = await executeWithSchema("hsv-color", "type", tsCode);
    } else if (space.tsId === "hwb") {
      tsCode = `
        variable srgb: Color.SRGB;
        srgb.r = ${srgb[0]}; srgb.g = ${srgb[1]}; srgb.b = ${srgb[2]};
        variable hsv: Color.HSV = srgb.to.hsv();
        hsv.to.hwb()
      `;
      tsResult = await executeWithSchema("hwb-color", "type", tsCode);
    }

    // Extract TokenScript coordinates
    if (tsResult?.value) {
      tsCoords = space.coords.map((c) => {
        const val = tsResult.value[c];
        return val && typeof val.value === "number" ? val.value : NaN;
      });
    }

    // Check for NaN mismatch (TokenScript has value, ColorJS has NaN - achromatic hue)
    const diffs = tsCoords.map((v, i) => {
      if (Number.isNaN(v) && Number.isNaN(cjCoords[i])) return 0; // Both NaN is OK
      if (!Number.isNaN(v) && Number.isNaN(cjCoords[i])) {
        // TokenScript has value, ColorJS has NaN - achromatic hue case
        nanMismatch = true;
        return 0; // Visually same, but semantically different
      }
      if (Number.isNaN(v) || Number.isNaN(cjCoords[i])) return Infinity; // Other NaN cases are errors
      return Math.abs(v - cjCoords[i]);
    });
    maxDiff = Math.max(...diffs);
  } catch (err) {
    console.error(`Error converting to ${space.id}:`, err);
    maxDiff = 999;
  }

  return {
    space: space.id,
    displayName: space.displayName,
    conversionPath: space.conversionPath,
    cssSupported: space.cssSupported,
    tokenScript: {
      coords: tsCoords,
      css: toCssColor(space, tsCoords),
    },
    colorJS: {
      coords: cjCoords,
      css: toCssColor(space, cjCoords),
    },
    match: maxDiff < 1e-6,
    maxDiff,
    nanMismatch,
  };
}

function generateCSV(results: ColorResult[]): string {
  const lines = ["Color,Space,ConversionPath,TS_C0,TS_C1,TS_C2,CJ_C0,CJ_C1,CJ_C2,MaxDiff,Status"];

  for (const result of results) {
    for (const conv of result.conversions) {
      // Determine status: PASS, ACHROMATIC_HUE (semantic diff), or FAIL
      let status = "FAIL";
      if (conv.match && !conv.nanMismatch) {
        status = "PASS";
      } else if (conv.match && conv.nanMismatch) {
        status = "ACHROMATIC_HUE"; // Visually same, but TS returns 0/180, CJ returns NaN
      }

      lines.push(
        [
          result.name,
          conv.space,
          `"${conv.conversionPath}"`,
          Number.isNaN(conv.tokenScript.coords[0]) ? "NaN" : conv.tokenScript.coords[0].toFixed(6),
          Number.isNaN(conv.tokenScript.coords[1]) ? "NaN" : conv.tokenScript.coords[1].toFixed(6),
          Number.isNaN(conv.tokenScript.coords[2]) ? "NaN" : conv.tokenScript.coords[2].toFixed(6),
          Number.isNaN(conv.colorJS.coords[0]) ? "NaN" : conv.colorJS.coords[0].toFixed(6),
          Number.isNaN(conv.colorJS.coords[1]) ? "NaN" : conv.colorJS.coords[1].toFixed(6),
          Number.isNaN(conv.colorJS.coords[2]) ? "NaN" : conv.colorJS.coords[2].toFixed(6),
          conv.maxDiff.toExponential(2),
          status,
        ].join(","),
      );
    }
  }

  return lines.join("\n");
}

function formatCoord(v: number, precision: number = 4): string {
  if (Number.isNaN(v)) return "NaN";
  return v.toFixed(precision);
}

function generateHTML(results: ColorResult[], csv: string): string {
  const totalTests = results.reduce((acc, r) => acc + r.conversions.length, 0);
  const passedTests = results.reduce(
    (acc, r) => acc + r.conversions.filter((c) => c.match).length,
    0,
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TokenScript Color Conversion Demo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      padding: 2rem;
      line-height: 1.6;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle {
      color: #888;
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }
    
    /* Explanation section */
    .explanation {
      background: #111;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .explanation h2 {
      font-size: 1rem;
      color: #4ade80;
      margin-bottom: 0.75rem;
    }
    .explanation p {
      color: #aaa;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    .explanation code {
      background: #1a1a1a;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, monospace;
      color: #fbbf24;
    }
    .conversion-graph {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 1rem;
      padding: 1rem;
      background: #1a1a1a;
      border-radius: 8px;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 0.8rem;
    }
    .graph-node {
      background: #22c55e20;
      color: #22c55e;
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      border: 1px solid #22c55e40;
    }
    .graph-arrow {
      color: #666;
    }
    
    /* Log Section */
    .log-section {
      margin-bottom: 1.5rem;
      background: #111;
      border: 1px solid #333;
      border-radius: 8px;
      overflow: hidden;
    }
    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #1a1a1a;
      border-bottom: 1px solid #333;
    }
    .log-header h3 {
      font-size: 0.9rem;
      color: #888;
      font-weight: 500;
    }
    .copy-btn {
      background: #22c55e;
      color: #000;
      border: none;
      padding: 0.4rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8rem;
    }
    .copy-btn:hover { background: #16a34a; }
    .copy-btn.copied { background: #666; color: #fff; }
    .log-content {
      max-height: 150px;
      overflow: auto;
      padding: 1rem;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 0.7rem;
      white-space: pre;
      color: #666;
    }
    
    .stats {
      display: flex;
      gap: 2rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: #1a1a1a;
      border-radius: 12px;
      border: 1px solid #333;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #4ade80;
    }
    .stat-value.warning { color: #fbbf24; }
    .stat-label {
      color: #888;
      font-size: 0.9rem;
    }
    .color-card {
      background: #141414;
      border: 1px solid #2a2a2a;
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .color-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .color-swatch {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .color-info h2 {
      font-size: 1.3rem;
      margin-bottom: 0.25rem;
    }
    .color-info code {
      color: #888;
      font-size: 0.9rem;
    }
    .conversions {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    .conversion {
      background: #1a1a1a;
      border-radius: 10px;
      padding: 1rem;
      border: 1px solid #2a2a2a;
    }
    .conversion.match { border-color: #22c55e; }
    .conversion.mismatch { border-color: #ef4444; }
    .conversion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .space-name {
      font-weight: 600;
      color: #fff;
      font-size: 0.9rem;
    }
    .match-badge {
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .match-badge.pass { background: #22c55e20; color: #22c55e; }
    .match-badge.fail { background: #ef444420; color: #ef4444; }
    .match-badge.achromatic { background: #f59e0b20; color: #f59e0b; }
    
    .conversion.achromatic-hue {
      border-color: #f59e0b40;
    }
    
    .achromatic-note {
      font-size: 0.65rem;
      color: #f59e0b;
      background: #f59e0b10;
      padding: 0.35rem 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.5rem;
      line-height: 1.3;
    }
    
    .conversion-path {
      font-size: 0.7rem;
      color: #666;
      margin-bottom: 0.75rem;
      font-style: italic;
    }
    
    /* Side-by-side swatches */
    .swatch-comparison {
      display: flex;
      gap: 2px;
      margin-bottom: 0.75rem;
      height: 50px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #333;
    }
    .swatch-half {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 4px 6px;
      position: relative;
    }
    .swatch-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-shadow: 0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8);
      color: white;
    }
    .swatch-half.ts { border-right: 1px solid rgba(255,255,255,0.1); }
    
    .swatch-unavailable {
      height: 50px;
      border-radius: 8px;
      border: 1px dashed #444;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.75rem;
      background: repeating-linear-gradient(
        45deg,
        #1a1a1a,
        #1a1a1a 10px,
        #222 10px,
        #222 20px
      );
    }
    .swatch-unavailable span {
      font-size: 0.7rem;
      color: #666;
      background: #1a1a1a;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }
    
    .values {
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 0.75rem;
    }
    .values-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.3rem;
    }
    .values .label {
      color: #666;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      width: 80px;
    }
    .values .coords {
      color: #e0e0e0;
      flex: 1;
    }
    .diff {
      color: #888;
      font-size: 0.7rem;
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid #333;
    }
    footer {
      margin-top: 3rem;
      text-align: center;
      color: #666;
      padding: 2rem;
      border-top: 1px solid #2a2a2a;
    }
  </style>
</head>
<body>
  <h1>🎨 TokenScript Color Conversions</h1>
  <p class="subtitle">Visual comparison with ColorJS • Generated ${new Date().toLocaleString()}</p>
  
  <!-- Explanation -->
  <div class="explanation">
    <h2>What is this testing?</h2>
    <p>
      This page compares <strong>TokenScript</strong> color conversions against <strong>ColorJS</strong> (the reference implementation).
      Each color goes through a conversion chain, and we verify the output matches ColorJS within tolerance (< 1e-6).
    </p>
    <p>
      <strong>TokenScript (TS)</strong> = Our implementation running in the TokenScript interpreter<br>
      <strong>ColorJS (CJ)</strong> = Reference implementation from <code>colorjs.io</code>
    </p>
    <p>
      <strong>Swatches:</strong> Side-by-side CSS-rendered colors. If they look identical, the conversion is correct.
      Some spaces (like HSV) aren't CSS-supported, so we show a placeholder.
    </p>
    <div class="conversion-graph">
      <span class="graph-node">RGB</span>
      <span class="graph-arrow">→</span>
      <span class="graph-node">sRGB</span>
      <span class="graph-arrow">→</span>
      <span class="graph-node">Linear sRGB</span>
      <span class="graph-arrow">→</span>
      <span class="graph-node">XYZ-D65</span>
      <span class="graph-arrow">→</span>
      <span class="graph-node">OKLab</span>
      <span class="graph-arrow">→</span>
      <span class="graph-node">OKLCH</span>
    </div>
  </div>
  
  <!-- Copyable Log -->
  <div class="log-section">
    <div class="log-header">
      <h3>📋 Test Results (CSV)</h3>
      <button class="copy-btn" onclick="copyLog()">Copy to Clipboard</button>
    </div>
    <div class="log-content" id="logContent">${csv}</div>
  </div>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-value ${passedTests === totalTests ? "" : "warning"}">${passedTests}/${totalTests}</div>
      <div class="stat-label">Tests Passed</div>
    </div>
    <div class="stat">
      <div class="stat-value">${results.length}</div>
      <div class="stat-label">Colors Tested</div>
    </div>
    <div class="stat">
      <div class="stat-value">${colorSpaces.length}</div>
      <div class="stat-label">Color Spaces</div>
    </div>
    <div class="stat">
      <div class="stat-value">${passedTests === totalTests ? "✅" : "⚠️"}</div>
      <div class="stat-label">${passedTests === totalTests ? "Perfect Parity" : "Issues Found"}</div>
    </div>
  </div>

  ${results
    .map(
      (result) => `
    <div class="color-card">
      <div class="color-header">
        <div class="color-swatch" style="background: ${result.inputHex}"></div>
        <div class="color-info">
          <h2>${result.name}</h2>
          <code>${result.inputHex} • RGB(${result.inputRGB.join(", ")})</code>
        </div>
      </div>
      <div class="conversions">
        ${result.conversions
          .map((conv) => {
            const tsCss = conv.tokenScript.css;
            const cjCss = conv.colorJS.css;
            const canShowSwatches = conv.cssSupported && tsCss && cjCss;

            // Determine badge style and text
            let badgeClass = conv.match ? "pass" : "fail";
            let badgeText = conv.match ? "✓ MATCH" : "✗ DIFF";
            let extraNote = "";

            if (conv.nanMismatch) {
              badgeClass = "achromatic";
              badgeText = "⚠ ACHROMATIC";
              extraNote = `<div class="achromatic-note">Hue undefined for achromatic colors. TS returns ${conv.tokenScript.coords[conv.tokenScript.coords.length - 1].toFixed(0)}°, ColorJS returns NaN.</div>`;
            }

            return `
          <div class="conversion ${conv.match ? "match" : "mismatch"} ${conv.nanMismatch ? "achromatic-hue" : ""}">
            <div class="conversion-header">
              <span class="space-name">${conv.displayName}</span>
              <span class="match-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="conversion-path">${conv.conversionPath}</div>
            ${extraNote}
            ${
              canShowSwatches
                ? `
            <div class="swatch-comparison">
              <div class="swatch-half ts" style="background: ${tsCss}">
                <span class="swatch-label">TS</span>
              </div>
              <div class="swatch-half cj" style="background: ${cjCss}">
                <span class="swatch-label">CJ</span>
              </div>
            </div>
            `
                : `
            <div class="swatch-unavailable">
              <span>${!conv.cssSupported ? "No CSS support" : "NaN values"}</span>
            </div>
            `
            }
            <div class="values">
              <div class="values-row">
                <span class="label">TokenScript</span>
                <span class="coords">[${conv.tokenScript.coords.map((v) => formatCoord(v)).join(", ")}]</span>
              </div>
              <div class="values-row">
                <span class="label">ColorJS</span>
                <span class="coords">[${conv.colorJS.coords.map((v) => formatCoord(v)).join(", ")}]</span>
              </div>
              <div class="diff">Δ max: ${conv.maxDiff < 0.0001 ? conv.maxDiff.toExponential(2) : conv.maxDiff.toFixed(6)}</div>
            </div>
          </div>
        `;
          })
          .join("")}
      </div>
    </div>
  `,
    )
    .join("")}

  <footer>
    <p>TokenScript Color Schema Registry • ColorJS Parity Testing</p>
    <p>All conversions run through the actual TokenScript interpreter</p>
  </footer>
  
  <script>
    function copyLog() {
      const content = document.getElementById('logContent').textContent;
      navigator.clipboard.writeText(content).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy to Clipboard';
          btn.classList.remove('copied');
        }, 2000);
      });
    }
  </script>
</body>
</html>`;
}

async function main() {
  console.log("🎨 Generating Color Demo...\n");

  const results: ColorResult[] = [];

  for (const color of testColors) {
    console.log(`Processing ${color.name}...`);

    const hex = rgbToHex(...color.rgb);
    const conversions: ConversionResult[] = [];

    for (const space of colorSpaces) {
      const result = await runConversion(color.rgb, space);
      conversions.push(result);
    }

    results.push({
      name: color.name,
      inputRGB: color.rgb,
      inputHex: hex,
      conversions,
    });
  }

  const csv = generateCSV(results);
  const html = generateHTML(results, csv);
  const outputPath = path.join(__dirname, "..", "demo", "color-comparison.html");
  fs.writeFileSync(outputPath, html);

  console.log(`\n✅ Demo generated: ${outputPath}`);
  console.log(`\nOpen in browser: file://${outputPath}`);
}

main().catch(console.error);
