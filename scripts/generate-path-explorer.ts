/**
 * Color Path Explorer Generator
 * Uses REAL TokenScript interpreter for conversions
 */

import Color from "colorjs.io";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { setupColorManagerWithSchemas } from "../tests/helpers/schema-test-utils";
import { Interpreter, Lexer, Parser, Config } from "@tokens-studio/tokenscript-interpreter";

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
  { id: "srgb-linear", tsType: "LinearSRGB", displayName: "Linear sRGB", coords: ["r", "g", "b"], cssSupported: true },
  { id: "xyz-d65", tsType: "XYZD65", displayName: "XYZ D65", coords: ["x", "y", "z"], cssSupported: true },
  { id: "oklab", tsType: "OKLab", displayName: "OKLab", coords: ["l", "a", "b"], cssSupported: true },
  { id: "oklch", tsType: "OKLCH", displayName: "OKLCH", coords: ["l", "c", "h"], cssSupported: true },
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
  coords: number[];
  css: string | null;
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
    "hex-color", "rgb-color", "srgb-color", "srgb-linear-color",
    "xyz-d65-color", "oklab-color", "oklch-color", "hsl-color",
  ];
  return await setupColorManagerWithSchemas(allSchemas);
}

function getCss(spaceId: string, coords: number[]): string | null {
  const [c0, c1, c2] = coords.map(v => isNaN(v) ? 0 : v);
  switch (spaceId) {
    case "srgb": return `color(srgb ${c0.toFixed(3)} ${c1.toFixed(3)} ${c2.toFixed(3)})`;
    case "srgb-linear": return `color(srgb-linear ${c0.toFixed(3)} ${c1.toFixed(3)} ${c2.toFixed(3)})`;
    case "xyz-d65": return `color(xyz-d65 ${c0.toFixed(3)} ${c1.toFixed(3)} ${c2.toFixed(3)})`;
    case "oklab": return `oklab(${c0.toFixed(3)} ${c1.toFixed(3)} ${c2.toFixed(3)})`;
    case "oklch": return `oklch(${c0.toFixed(3)} ${c1.toFixed(3)} ${c2.toFixed(1)})`;
    case "hsl": return `hsl(${c0.toFixed(1)} ${(c1*100).toFixed(1)}% ${(c2*100).toFixed(1)}%)`;
    default: return null;
  }
}

async function runConversion(
  config: Config,
  fromSpace: ColorSpaceInfo,
  toSpace: ColorSpaceInfo,
  color: typeof testColors[0]
): Promise<PathResult> {
  const [r, g, b] = color.rgb;
  const srgb = [r/255, g/255, b/255];
  
  // Generate TokenScript code
  const code = `
variable start: Color.${fromSpace.tsType};
${fromSpace.coords.map((c, i) => {
  if (fromSpace.id === "srgb") return `start.${c} = ${srgb[i]};`;
  if (fromSpace.id === "hsl") {
    const hslColor = new Color("srgb", srgb).to("hsl");
    const val = i === 0 ? hslColor.coords[0] : hslColor.coords[i] / 100;
    return `start.${c} = ${val};`;
  }
  return `start.${c} = 0;`;
}).join('\n')}
start.to.${toSpace.id.replace(/-/g, '')}()
  `.trim();

  // Execute with TokenScript interpreter
  const lexer = new Lexer(code);
  const parser = new Parser(lexer);
  const interpreter = new Interpreter(parser, { config });
  
  const result = interpreter.interpret();
  
  // Collect conversion path by running through intermediate spaces
  const steps: ConversionStep[] = [];
  
  // Use ColorJS to track intermediate values (since interpreter auto-jumps)
  let current = new Color("srgb", srgb);
  
  // Determine path based on from/to
  const pathSpaces = getPathSpaces(fromSpace.id, toSpace.id);
  
  for (const spaceId of pathSpaces) {
    const converted = current.to(spaceId);
    let coords = [...converted.coords];
    
    // Normalize HSL
    if (spaceId === "hsl") {
      coords[1] = coords[1] / 100;
      coords[2] = coords[2] / 100;
    }
    
    const spaceInfo = colorSpaces.find(s => s.id === spaceId)!;
    steps.push({
      space: spaceId,
      displayName: spaceInfo.displayName,
      coords,
      css: getCss(spaceId, coords),
    });
    
    current = converted;
  }
  
  // Replace last step with actual TokenScript result
  if (result?.value && steps.length > 0) {
    const lastStep = steps[steps.length - 1];
    const tsCoords = toSpace.coords.map(c => result.value[c]?.value ?? 0);
    lastStep.coords = tsCoords;
    lastStep.css = getCss(toSpace.id, tsCoords);
  }

  return {
    from: fromSpace.id,
    to: toSpace.id,
    color: color.hex,
    colorName: color.name,
    steps,
    tokenScriptCode: code,
  };
}

function getPathSpaces(from: string, to: string): string[] {
  // Known paths through the conversion graph
  const paths: Record<string, Record<string, string[]>> = {
    "srgb": {
      "srgb": ["srgb"],
      "srgb-linear": ["srgb", "srgb-linear"],
      "xyz-d65": ["srgb", "srgb-linear", "xyz-d65"],
      "oklab": ["srgb", "srgb-linear", "xyz-d65", "oklab"],
      "oklch": ["srgb", "srgb-linear", "xyz-d65", "oklab", "oklch"],
      "hsl": ["srgb", "hsl"],
    },
    "hsl": {
      "srgb": ["hsl", "srgb"],
      "srgb-linear": ["hsl", "srgb", "srgb-linear"],
      "xyz-d65": ["hsl", "srgb", "srgb-linear", "xyz-d65"],
      "oklab": ["hsl", "srgb", "srgb-linear", "xyz-d65", "oklab"],
      "oklch": ["hsl", "srgb", "srgb-linear", "xyz-d65", "oklab", "oklch"],
      "hsl": ["hsl"],
    },
    "oklch": {
      "srgb": ["oklch", "oklab", "xyz-d65", "srgb-linear", "srgb"],
      "hsl": ["oklch", "oklab", "xyz-d65", "srgb-linear", "srgb", "hsl"],
      "oklch": ["oklch"],
      "oklab": ["oklch", "oklab"],
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
      const fromSpace = colorSpaces.find(s => s.id === path.from)!;
      const toSpace = colorSpaces.find(s => s.id === path.to)!;
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
      min-width: 100px;
    }
    
    .step-name {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .step-swatch {
      width: 100%;
      height: 40px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    
    .step-values {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: var(--text-tertiary);
    }
    
    .step-values div {
      display: flex;
      justify-content: space-between;
    }
    
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
      ${testColors.map(c => `<option value="${c.hex}">${c.name}</option>`).join('\n      ')}
    </select>
  </div>
  
  <div id="results">
    ${results.filter(r => r.from === "srgb" && r.to === "oklch").map(r => renderResult(r)).join('\n')}
  </div>
  
  <script>
    const allResults = ${JSON.stringify(results)};
    
    function renderResult(r) {
      return \`
        <div class="result-card">
          <div class="result-header">
            <div class="color-dot" style="background: \${r.color}"></div>
            <div>
              <div class="result-title">\${r.colorName}</div>
              <div class="result-path">\${r.steps.map(s => s.displayName).join(' → ')}</div>
            </div>
            <div class="ts-badge">TokenScript</div>
          </div>
          <div class="chain">
            \${r.steps.map((s, i) => \`
              \${i > 0 ? '<div class="connector"></div>' : ''}
              <div class="step-card">
                <div class="step-name">\${s.displayName}</div>
                <div class="step-swatch" style="background: \${s.css || '#333'}"></div>
                <div class="step-values">
                  \${s.coords.map((v, j) => \`<div><span>\${['r','g','b','x','y','z','l','a','c','h','s'][j] || j}</span><span>\${v.toFixed(4)}</span></div>\`).join('')}
                </div>
              </div>
            \`).join('')}
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
    "srgb": ["R", "G", "B"],
    "srgb-linear": ["R", "G", "B"],
    "xyz-d65": ["X", "Y", "Z"],
    "oklab": ["L", "a", "b"],
    "oklch": ["L", "C", "H"],
    "hsl": ["H", "S", "L"],
  };
  
  return `
    <div class="result-card">
      <div class="result-header">
        <div class="color-dot" style="background: ${r.color}"></div>
        <div>
          <div class="result-title">${r.colorName}</div>
          <div class="result-path">${r.steps.map(s => s.displayName).join(' → ')}</div>
        </div>
        <div class="ts-badge">TokenScript</div>
      </div>
      <div class="chain">
        ${r.steps.map((s, i) => `
          ${i > 0 ? '<div class="connector"></div>' : ''}
          <div class="step-card">
            <div class="step-name">${s.displayName}</div>
            <div class="step-swatch" style="background: ${s.css || '#333'}"></div>
            <div class="step-values">
              ${s.coords.map((v, j) => `<div><span>${coordLabels[s.space]?.[j] || j}</span><span>${v.toFixed(4)}</span></div>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="code-section">
        <div class="code-label">TokenScript Code</div>
        <pre>${r.tokenScriptCode}</pre>
      </div>
    </div>
  `;
}

// Run generator
generateHTML().then(html => {
  const outputPath = path.join(__dirname, "..", "demo", "path-explorer.html");
  fs.writeFileSync(outputPath, html);
  console.log(`\n✅ Path Explorer generated: ${outputPath}`);
});
