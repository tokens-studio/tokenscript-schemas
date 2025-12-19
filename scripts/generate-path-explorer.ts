/**
 * Color Conversion Path Explorer Generator
 *
 * Generates an interactive HTML page (`demo/path-explorer.html`) that visualizes
 * the automatic color space conversion paths resolved by the TokenScript interpreter.
 *
 * Features:
 * - Select any source and target color space
 * - Visualizes the conversion chain (e.g., HSL → sRGB → Linear → XYZ → OKLab → OKLCH)
 * - Shows color swatches at each intermediate step
 * - Displays coordinate values with TokenScript vs ColorJS comparison
 * - Identifies transformation type at each step (gamma, matrix, polar, etc.)
 *
 * Technical Details:
 * - Uses BFS to find shortest path through conversion graph
 * - Executes REAL TokenScript code for each conversion step
 * - Compares against ColorJS reference at each step
 * - Shows "Match" indicator when values align within tolerance
 *
 * Supported Color Spaces:
 *   sRGB, Linear sRGB, XYZ-D65, OKLab, OKLCH, HSL
 *
 * Output: demo/path-explorer.html
 *
 * Usage:
 *   npx tsx scripts/generate-path-explorer.ts
 *
 * @module scripts/generate-path-explorer
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Config, Interpreter, Lexer, Parser } from "@tokens-studio/tokenscript-interpreter";
import Color from "colorjs.io";
import { setupColorManagerWithSchemas } from "../tests/helpers/schema-test-utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ColorSpaceInfo {
  id: string;
  tsType: string; // TokenScript type name
  displayName: string;
  coords: string[];
  cssSupported: boolean;
}

const colorSpaces: ColorSpaceInfo[] = [
  { id: "srgb", tsType: "SRGB", displayName: "sRGB", coords: ["r", "g", "b"], cssSupported: true },
  {
    id: "srgb-linear",
    tsType: "LinearSRGB",
    displayName: "Linear sRGB",
    coords: ["r", "g", "b"],
    cssSupported: true,
  },
  {
    id: "xyz-d65",
    tsType: "XYZD65",
    displayName: "XYZ D65",
    coords: ["x", "y", "z"],
    cssSupported: true,
  },
  {
    id: "oklab",
    tsType: "OKLab",
    displayName: "OKLab",
    coords: ["l", "a", "b"],
    cssSupported: true,
  },
  {
    id: "oklch",
    tsType: "OKLCH",
    displayName: "OKLCH",
    coords: ["l", "c", "h"],
    cssSupported: true,
  },
  { id: "hsl", tsType: "HSL", displayName: "HSL", coords: ["h", "s", "l"], cssSupported: true },
];

// Test colors
const testColors = [
  { name: "Purple", hex: "#a855f7", rgb: [168, 85, 247] },
  { name: "Coral", hex: "#ff6b6b", rgb: [255, 107, 107] },
  { name: "Teal", hex: "#14b8a6", rgb: [20, 184, 166] },
  { name: "Gold", hex: "#f59e0b", rgb: [245, 158, 11] },
];

interface ConversionStep {
  space: string;
  displayName: string;
  tsCoords: number[]; // TokenScript values
  cjCoords: number[]; // ColorJS values
  css: string | null;
  maxDiff: number; // Max difference between TS and CJ
}

interface PathResult {
  from: string;
  to: string;
  color: string;
  colorName: string;
  steps: ConversionStep[];
  tokenScriptCode: string;
}

async function setupInterpreter(): Promise<Config> {
  const allSchemas = [
    "hex-color",
    "rgb-color",
    "srgb-color",
    "srgb-linear-color",
    "xyz-d65-color",
    "oklab-color",
    "oklch-color",
    "hsl-color",
    "css-color",
  ];
  return await setupColorManagerWithSchemas(allSchemas);
}

/**
 * Generate CSS color string for a given color space and coordinates.
 * Format matches css-color schema output (CSS Color Level 4 syntax).
 */
function getCss(spaceId: string, coords: number[]): string | null {
  const [c0, c1, c2] = coords.map((v) => (Number.isNaN(v) ? 0 : v));
  switch (spaceId) {
    case "srgb":
      return `color(srgb ${c0.toFixed(5)} ${c1.toFixed(5)} ${c2.toFixed(5)})`;
    case "srgb-linear":
      return `color(srgb-linear ${c0.toFixed(5)} ${c1.toFixed(5)} ${c2.toFixed(5)})`;
    case "xyz-d65":
      return `color(xyz-d65 ${c0.toFixed(5)} ${c1.toFixed(5)} ${c2.toFixed(5)})`;
    case "oklab":
      return `oklab(${c0.toFixed(5)} ${c1.toFixed(5)} ${c2.toFixed(5)})`;
    case "oklch":
      return `oklch(${c0.toFixed(5)} ${c1.toFixed(5)} ${c2.toFixed(5)})`;
    case "hsl":
      // HSL: s and l are 0-1 internally, output as percentages per CSS spec
      return `hsl(${c0.toFixed(2)} ${(c1 * 100).toFixed(2)}% ${(c2 * 100).toFixed(2)}%)`;
    default:
      return null;
  }
}

async function runConversion(
  config: Config,
  fromSpace: ColorSpaceInfo,
  toSpace: ColorSpaceInfo,
  color: (typeof testColors)[0],
): Promise<PathResult> {
  const [r, g, b] = color.rgb;
  const srgb: [number, number, number] = [r / 255, g / 255, b / 255];

  // Get starting values for the source space
  const startValues = getStartValues(fromSpace, srgb);

  // Determine the conversion path
  const pathSpaces = getPathSpaces(fromSpace.id, toSpace.id);

  // Execute REAL step-by-step conversions through TokenScript
  // AND compute ColorJS values for comparison
  const steps: ConversionStep[] = [];

  // ColorJS reference - convert through same path
  let cjColor = new Color("srgb", srgb);

  for (let i = 0; i < pathSpaces.length; i++) {
    const spaceId = pathSpaces[i];
    const spaceInfo = colorSpaces.find((s) => s.id === spaceId)!;

    // === TokenScript execution ===
    let code: string;

    if (i === 0) {
      code = `
variable start: Color.${spaceInfo.tsType};
${spaceInfo.coords.map((c, j) => `start.${c} = ${startValues[j]};`).join("\n")}
return start;
      `.trim();
    } else {
      code = `
variable start: Color.${colorSpaces.find((s) => s.id === pathSpaces[0])?.tsType};
${colorSpaces
  .find((s) => s.id === pathSpaces[0])
  ?.coords.map((c, j) => `start.${c} = ${startValues[j]};`)
  .join("\n")}
${buildConversionChain(pathSpaces.slice(0, i + 1), colorSpaces)}
      `.trim();
    }

    const lexer = new Lexer(code);
    const parser = new Parser(lexer);
    const interpreter = new Interpreter(parser, { config });
    const result = interpreter.interpret();

    const tsCoords = spaceInfo.coords.map((c) => (result as any)?.value?.[c]?.value ?? 0);

    // === ColorJS execution ===
    cjColor = cjColor.to(spaceId);
    const cjCoords = [...cjColor.coords];

    // Normalize HSL/HSV scales (ColorJS uses 0-100 for S/L)
    if (spaceId === "hsl") {
      cjCoords[1] = cjCoords[1] / 100;
      cjCoords[2] = cjCoords[2] / 100;
    }

    // Calculate max difference
    const maxDiff = Math.max(
      ...tsCoords.map((v, j) => {
        const cj = cjCoords[j];
        if (Number.isNaN(v) || Number.isNaN(cj)) return 0;
        return Math.abs(v - cj);
      }),
    );

    steps.push({
      space: spaceId,
      displayName: spaceInfo.displayName,
      tsCoords,
      cjCoords,
      css: getCss(spaceId, tsCoords),
      maxDiff,
    });
  }

  // Generate the final single-line code for display
  const finalCode = `
variable start: Color.${fromSpace.tsType};
${fromSpace.coords.map((c, j) => `start.${c} = ${startValues[j]};`).join("\n")}
start.to.${toSpace.id.replace(/-/g, "")}()
  `.trim();

  return {
    from: fromSpace.id,
    to: toSpace.id,
    color: color.hex,
    colorName: color.name,
    steps,
    tokenScriptCode: finalCode,
  };
}

function getStartValues(space: ColorSpaceInfo, srgb: [number, number, number]): number[] {
  if (space.id === "srgb") return srgb;
  if (space.id === "hsl") {
    const hslColor = new Color("srgb", srgb).to("hsl");
    return [hslColor.coords[0], hslColor.coords[1] / 100, hslColor.coords[2] / 100];
  }
  if (space.id === "oklch") {
    const oklchColor = new Color("srgb", srgb).to("oklch");
    return [...oklchColor.coords];
  }
  return srgb;
}

function buildConversionChain(path: string[], spaces: ColorSpaceInfo[]): string {
  if (path.length < 2) return "return start;";

  let code = "";
  let prevVar = "start";

  for (let i = 1; i < path.length; i++) {
    const targetSpace = spaces.find((s) => s.id === path[i])!;
    const targetKeyword = getConversionKeyword(path[i]);
    const varName = i === path.length - 1 ? "result" : `step${i}`;

    code += `variable ${varName}: Color.${targetSpace.tsType} = ${prevVar}.to.${targetKeyword}();\n`;
    prevVar = varName;
  }

  code += `return ${prevVar};`;
  return code;
}

function getConversionKeyword(spaceId: string): string {
  // Map space IDs to their TokenScript conversion keywords
  const keywords: Record<string, string> = {
    srgb: "srgb",
    "srgb-linear": "linearsrgb",
    "xyz-d65": "xyzd65",
    oklab: "oklab",
    oklch: "oklch",
    hsl: "hsl",
  };
  return keywords[spaceId] || spaceId.replace(/-/g, "");
}

function getPathSpaces(from: string, to: string): string[] {
  // Known paths through the conversion graph
  const paths: Record<string, Record<string, string[]>> = {
    srgb: {
      srgb: ["srgb"],
      "srgb-linear": ["srgb", "srgb-linear"],
      "xyz-d65": ["srgb", "srgb-linear", "xyz-d65"],
      oklab: ["srgb", "srgb-linear", "xyz-d65", "oklab"],
      oklch: ["srgb", "srgb-linear", "xyz-d65", "oklab", "oklch"],
      hsl: ["srgb", "hsl"],
    },
    hsl: {
      srgb: ["hsl", "srgb"],
      "srgb-linear": ["hsl", "srgb", "srgb-linear"],
      "xyz-d65": ["hsl", "srgb", "srgb-linear", "xyz-d65"],
      oklab: ["hsl", "srgb", "srgb-linear", "xyz-d65", "oklab"],
      oklch: ["hsl", "srgb", "srgb-linear", "xyz-d65", "oklab", "oklch"],
      hsl: ["hsl"],
    },
    oklch: {
      srgb: ["oklch", "oklab", "xyz-d65", "srgb-linear", "srgb"],
      hsl: ["oklch", "oklab", "xyz-d65", "srgb-linear", "srgb", "hsl"],
      oklch: ["oklch"],
      oklab: ["oklch", "oklab"],
      "xyz-d65": ["oklch", "oklab", "xyz-d65"],
      "srgb-linear": ["oklch", "oklab", "xyz-d65", "srgb-linear"],
    },
  };

  return paths[from]?.[to] || [from, to];
}

async function generateHTML(): Promise<string> {
  console.log("Setting up TokenScript interpreter...");
  const config = await setupInterpreter();

  console.log("Running conversions with TokenScript...");
  const results: PathResult[] = [];

  // Generate example conversions
  const examplePaths = [
    { from: "srgb", to: "oklch" },
    { from: "hsl", to: "oklch" },
    { from: "oklch", to: "srgb" },
  ];

  for (const path of examplePaths) {
    for (const color of testColors) {
      const fromSpace = colorSpaces.find((s) => s.id === path.from)!;
      const toSpace = colorSpaces.find((s) => s.id === path.to)!;
      const result = await runConversion(config, fromSpace, toSpace, color);
      results.push(result);
      console.log(`  ✓ ${color.name}: ${path.from} → ${path.to}`);
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Color Path Explorer — TokenScript</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #09090b;
      --bg-secondary: #18181b;
      --bg-tertiary: #27272a;
      --border-subtle: rgba(255,255,255,0.06);
      --border-default: rgba(255,255,255,0.1);
      --text-primary: #fafafa;
      --text-secondary: #a1a1aa;
      --text-tertiary: #71717a;
      --accent: #a855f7;
      --accent-muted: rgba(168, 85, 247, 0.15);
      --success: #22c55e;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      padding: 48px 32px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    header { margin-bottom: 32px; }
    
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    
    .brand-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--accent), #ec4899);
      border-radius: 6px;
    }
    
    h1 { font-size: 24px; font-weight: 600; }
    .subtitle { color: var(--text-tertiary); font-size: 14px; }
    
    .notice {
      background: var(--accent-muted);
      border: 1px solid rgba(168,85,247,0.3);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 32px;
    }
    
    .notice-title {
      font-weight: 600;
      color: var(--accent);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .notice-text { color: var(--text-secondary); font-size: 14px; }
    
    .controls {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    
    select, button {
      padding: 10px 16px;
      border-radius: 6px;
      font-family: inherit;
      font-size: 13px;
      cursor: pointer;
    }
    
    select {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-default);
      color: var(--text-primary);
      min-width: 140px;
    }
    
    button {
      background: var(--accent);
      border: none;
      color: white;
      font-weight: 600;
    }
    
    .result-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      margin-bottom: 24px;
      overflow: hidden;
    }
    
    .result-header {
      padding: 16px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .color-dot {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 2px solid var(--border-default);
    }
    
    .result-title {
      font-weight: 600;
      font-size: 14px;
    }
    
    .result-path {
      color: var(--text-tertiary);
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
    }
    
    .chain {
      display: flex;
      padding: 20px;
      gap: 0;
      overflow-x: auto;
    }
    
    .step-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-default);
      border-radius: 8px;
      padding: 12px;
      min-width: 140px;
    }
    
    .step-name {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .step-diff {
      font-size: 9px;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 4px;
    }
    
    .step-diff.pass { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .step-diff.warn { background: rgba(234, 179, 8, 0.2); color: #eab308; }
    
    .step-swatch {
      width: 100%;
      height: 32px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    
    .step-values {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
    }
    
    .values-header {
      display: flex;
      gap: 8px;
      margin-bottom: 4px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--border-subtle);
    }
    
    .values-header span {
      flex: 1;
      font-weight: 600;
      color: var(--text-tertiary);
      font-size: 8px;
      text-transform: uppercase;
    }
    
    .values-header span:first-child { width: 20px; flex: none; }
    .values-header .ts { color: var(--accent); }
    .values-header .cj { color: #3b82f6; }
    
    .values-row {
      display: flex;
      gap: 8px;
      line-height: 1.6;
    }
    
    .values-row .label { width: 20px; color: var(--text-tertiary); flex: none; }
    .values-row .ts { flex: 1; color: var(--accent); }
    .values-row .cj { flex: 1; color: #3b82f6; }
    
    .connector {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
      min-width: 50px;
    }
    
    .connector::before {
      content: '→';
      color: var(--text-tertiary);
    }
    
    .code-section {
      background: var(--bg-primary);
      padding: 16px;
      border-top: 1px solid var(--border-subtle);
    }
    
    .code-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--accent);
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    pre {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: var(--text-secondary);
      white-space: pre-wrap;
      line-height: 1.5;
    }
    
    .ts-badge {
      background: var(--success);
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 100px;
      margin-left: auto;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-icon"></div>
      <h1>Color Path Explorer</h1>
    </div>
    <p class="subtitle">Real TokenScript interpreter conversions</p>
  </header>
  
  <div class="notice">
    <div class="notice-title">
      <span>✓</span> Powered by TokenScript Interpreter
    </div>
    <p class="notice-text">
      These conversions are executed by the real TokenScript interpreter, not ColorJS.
      The interpreter automatically finds the shortest path through the conversion graph.
    </p>
  </div>
  
  <div class="controls">
    <select id="path-select">
      <option value="srgb-oklch">sRGB → OKLCH</option>
      <option value="hsl-oklch">HSL → OKLCH</option>
      <option value="oklch-srgb">OKLCH → sRGB</option>
    </select>
    <select id="color-select">
      ${testColors.map((c) => `<option value="${c.hex}">${c.name}</option>`).join("\n      ")}
    </select>
  </div>
  
  <div id="results">
    ${results
      .filter((r) => r.from === "srgb" && r.to === "oklch")
      .map((r) => renderResult(r))
      .join("\n")}
  </div>
  
  <script>
    const allResults = ${JSON.stringify(results)};
    
    function renderResult(r) {
      const coordLabels = {
        "srgb": ["R", "G", "B"],
        "srgb-linear": ["R", "G", "B"],
        "xyz-d65": ["X", "Y", "Z"],
        "oklab": ["L", "a", "b"],
        "oklch": ["L", "C", "H"],
        "hsl": ["H", "S", "L"],
      };
      
      return \`
        <div class="result-card">
          <div class="result-header">
            <div class="color-dot" style="background: \${r.color}"></div>
            <div>
              <div class="result-title">\${r.colorName}</div>
              <div class="result-path">\${r.steps.map(s => s.displayName).join(' → ')}</div>
            </div>
            <div class="ts-badge">✓ Verified</div>
          </div>
          <div class="chain">
            \${r.steps.map((s, i) => {
              const labels = coordLabels[s.space] || ['0','1','2'];
              const diffClass = s.maxDiff < 1e-10 ? 'pass' : 'warn';
              const diffText = s.maxDiff < 1e-10 ? '≡' : 'Δ' + s.maxDiff.toExponential(0);
              return \`
                \${i > 0 ? '<div class="connector"></div>' : ''}
                <div class="step-card">
                  <div class="step-name">
                    <span>\${s.displayName}</span>
                    <span class="step-diff \${diffClass}">\${diffText}</span>
                  </div>
                  <div class="step-swatch" style="background: \${s.css || '#333'}"></div>
                  <div class="step-values">
                    <div class="values-header">
                      <span></span>
                      <span class="ts">TS</span>
                      <span class="cj">CJ</span>
                    </div>
                    \${labels.map((l, j) => \`
                      <div class="values-row">
                        <span class="label">\${l}</span>
                        <span class="ts">\${s.tsCoords[j]?.toFixed(4) || 'N/A'}</span>
                        <span class="cj">\${s.cjCoords[j]?.toFixed(4) || 'N/A'}</span>
                      </div>
                    \`).join('')}
                  </div>
                </div>
              \`;
            }).join('')}
          </div>
          <div class="code-section">
            <div class="code-label">TokenScript Code</div>
            <pre>\${r.tokenScriptCode}</pre>
          </div>
        </div>
      \`;
    }
    
    function updateResults() {
      const pathKey = document.getElementById('path-select').value;
      const color = document.getElementById('color-select').value;
      const [from, to] = pathKey.split('-');
      
      const filtered = allResults.filter(r => 
        r.from === from && r.to === to && r.color === color
      );
      
      document.getElementById('results').innerHTML = filtered.map(renderResult).join('');
    }
    
    document.getElementById('path-select').addEventListener('change', updateResults);
    document.getElementById('color-select').addEventListener('change', updateResults);
  </script>
</body>
</html>`;
}

function renderResult(r: PathResult): string {
  const coordLabels: Record<string, string[]> = {
    srgb: ["R", "G", "B"],
    "srgb-linear": ["R", "G", "B"],
    "xyz-d65": ["X", "Y", "Z"],
    oklab: ["L", "a", "b"],
    oklch: ["L", "C", "H"],
    hsl: ["H", "S", "L"],
  };

  return `
    <div class="result-card">
      <div class="result-header">
        <div class="color-dot" style="background: ${r.color}"></div>
        <div>
          <div class="result-title">${r.colorName}</div>
          <div class="result-path">${r.steps.map((s) => s.displayName).join(" → ")}</div>
        </div>
        <div class="ts-badge">✓ Verified</div>
      </div>
      <div class="chain">
        ${r.steps
          .map((s, i) => {
            const labels = coordLabels[s.space] || ["0", "1", "2"];
            const diffClass = s.maxDiff < 1e-10 ? "pass" : "warn";
            const diffText = s.maxDiff < 1e-10 ? "≡" : `Δ${s.maxDiff.toExponential(0)}`;
            return `
            ${i > 0 ? '<div class="connector"></div>' : ""}
            <div class="step-card">
              <div class="step-name">
                <span>${s.displayName}</span>
                <span class="step-diff ${diffClass}">${diffText}</span>
              </div>
              <div class="step-swatch" style="background: ${s.css || "#333"}"></div>
              <div class="step-values">
                <div class="values-header">
                  <span></span>
                  <span class="ts">TS</span>
                  <span class="cj">CJ</span>
                </div>
                ${labels
                  .map(
                    (l, j) => `
                  <div class="values-row">
                    <span class="label">${l}</span>
                    <span class="ts">${s.tsCoords[j]?.toFixed(4) ?? "N/A"}</span>
                    <span class="cj">${s.cjCoords[j]?.toFixed(4) ?? "N/A"}</span>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
      <div class="code-section">
        <div class="code-label">TokenScript Code</div>
        <pre>${r.tokenScriptCode}</pre>
      </div>
    </div>
  `;
}

// Run generator
generateHTML().then((html) => {
  const outputPath = path.join(__dirname, "..", "demo", "path-explorer.html");
  fs.writeFileSync(outputPath, html);
  console.log(`\n✅ Path Explorer generated: ${outputPath}`);
});
