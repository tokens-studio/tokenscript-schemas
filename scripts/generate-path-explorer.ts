/**
 * Color Path Explorer Generator
 * 
 * Creates an interactive HTML page that shows the conversion path
 * between any two color spaces, with intermediate values at each step
 */

import Color from "colorjs.io";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define all color spaces and their relationships
interface ColorSpaceInfo {
  id: string;
  name: string;
  displayName: string;
  coords: string[];
  cssSupported: boolean;
  parent?: string; // The space this converts FROM
  cssFormat: (coords: number[]) => string | null;
}

const colorSpaces: ColorSpaceInfo[] = [
  {
    id: "srgb",
    name: "SRGB",
    displayName: "sRGB",
    coords: ["r", "g", "b"],
    cssSupported: true,
    cssFormat: (c) => `color(srgb ${c.map(v => v.toFixed(4)).join(" ")})`,
  },
  {
    id: "srgb-linear",
    name: "LinearSRGB",
    displayName: "Linear sRGB",
    coords: ["r", "g", "b"],
    cssSupported: true,
    parent: "srgb",
    cssFormat: (c) => `color(srgb-linear ${c.map(v => v.toFixed(4)).join(" ")})`,
  },
  {
    id: "xyz-d65",
    name: "XYZD65",
    displayName: "XYZ (D65)",
    coords: ["x", "y", "z"],
    cssSupported: true,
    parent: "srgb-linear",
    cssFormat: (c) => `color(xyz-d65 ${c.map(v => v.toFixed(4)).join(" ")})`,
  },
  {
    id: "xyz-d50",
    name: "XYZD50",
    displayName: "XYZ (D50)",
    coords: ["x", "y", "z"],
    cssSupported: true,
    parent: "xyz-d65",
    cssFormat: (c) => `color(xyz-d50 ${c.map(v => v.toFixed(4)).join(" ")})`,
  },
  {
    id: "oklab",
    name: "OKLab",
    displayName: "OKLab",
    coords: ["l", "a", "b"],
    cssSupported: true,
    parent: "xyz-d65",
    cssFormat: (c) => `oklab(${c[0].toFixed(4)} ${c[1].toFixed(4)} ${c[2].toFixed(4)})`,
  },
  {
    id: "oklch",
    name: "OKLCH",
    displayName: "OKLCH",
    coords: ["l", "c", "h"],
    cssSupported: true,
    parent: "oklab",
    cssFormat: (c) => `oklch(${c[0].toFixed(4)} ${c[1].toFixed(4)} ${isNaN(c[2]) ? 0 : c[2].toFixed(2)})`,
  },
  {
    id: "lab",
    name: "Lab",
    displayName: "CIE Lab",
    coords: ["l", "a", "b"],
    cssSupported: true,
    parent: "xyz-d50",
    cssFormat: (c) => `lab(${c[0].toFixed(2)} ${c[1].toFixed(4)} ${c[2].toFixed(4)})`,
  },
  {
    id: "lch",
    name: "LCH",
    displayName: "CIE LCH",
    coords: ["l", "c", "h"],
    cssSupported: true,
    parent: "lab",
    cssFormat: (c) => `lch(${c[0].toFixed(2)} ${c[1].toFixed(4)} ${isNaN(c[2]) ? 0 : c[2].toFixed(2)})`,
  },
  {
    id: "hsl",
    name: "HSL",
    displayName: "HSL",
    coords: ["h", "s", "l"],
    cssSupported: true,
    parent: "srgb",
    cssFormat: (c) => `hsl(${isNaN(c[0]) ? 0 : c[0].toFixed(1)} ${(c[1] * 100).toFixed(1)}% ${(c[2] * 100).toFixed(1)}%)`,
  },
  {
    id: "hsv",
    name: "HSV",
    displayName: "HSV",
    coords: ["h", "s", "v"],
    cssSupported: false,
    parent: "srgb",
    cssFormat: () => null,
  },
  {
    id: "hwb",
    name: "HWB",
    displayName: "HWB",
    coords: ["h", "w", "b"],
    cssSupported: true,
    parent: "srgb", // Actually from HSV but we can compute from sRGB
    cssFormat: (c) => `hwb(${isNaN(c[0]) ? 0 : c[0].toFixed(1)} ${(c[1] * 100).toFixed(1)}% ${(c[2] * 100).toFixed(1)}%)`,
  },
  {
    id: "p3",
    name: "P3",
    displayName: "Display P3",
    coords: ["r", "g", "b"],
    cssSupported: true,
    parent: "xyz-d65",
    cssFormat: (c) => `color(display-p3 ${c.map(v => v.toFixed(4)).join(" ")})`,
  },
];

// Build the conversion graph
function buildConversionGraph(): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  
  // Initialize all nodes
  for (const space of colorSpaces) {
    graph.set(space.id, []);
  }
  
  // Add edges (bidirectional)
  for (const space of colorSpaces) {
    if (space.parent) {
      // Add edge from parent to child
      graph.get(space.parent)?.push(space.id);
      // Add edge from child to parent
      graph.get(space.id)?.push(space.parent);
    }
  }
  
  // Add some additional direct connections based on ColorJS
  // sRGB ↔ HSL, HSV, HWB are direct
  
  return graph;
}

// Find shortest path using BFS
function findPath(from: string, to: string, graph: Map<string, string[]>): string[] | null {
  if (from === to) return [from];
  
  const visited = new Set<string>();
  const queue: { node: string; path: string[] }[] = [{ node: from, path: [from] }];
  
  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    
    if (visited.has(node)) continue;
    visited.add(node);
    
    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      const newPath = [...path, neighbor];
      if (neighbor === to) return newPath;
      queue.push({ node: neighbor, path: newPath });
    }
  }
  
  return null;
}

function generateHTML(): string {
  const graph = buildConversionGraph();
  
  // Pre-compute all paths for the JavaScript
  const allPaths: Record<string, Record<string, string[]>> = {};
  for (const from of colorSpaces) {
    allPaths[from.id] = {};
    for (const to of colorSpaces) {
      const path = findPath(from.id, to.id, graph);
      if (path) {
        allPaths[from.id][to.id] = path;
      }
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Color Conversion Path Explorer</title>
  <script src="https://colorjs.io/dist/color.global.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'SF Pro', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      background: linear-gradient(145deg, #0d0d0d 0%, #1a1a2e 50%, #0d0d0d 100%);
      color: #e0e0e0;
      min-height: 100vh;
      padding: 2rem;
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .subtitle {
      color: #888;
      margin-bottom: 2rem;
    }
    
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: rgba(255,255,255,0.03);
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .control-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .control-group label {
      font-size: 0.75rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    select, input[type="text"], input[type="color"] {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(0,0,0,0.3);
      color: #fff;
      font-size: 1rem;
      min-width: 150px;
    }
    
    select:focus, input:focus {
      outline: none;
      border-color: #60a5fa;
    }
    
    input[type="color"] {
      width: 60px;
      height: 44px;
      padding: 4px;
      cursor: pointer;
    }
    
    button {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      border: none;
      background: linear-gradient(135deg, #60a5fa, #a78bfa);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.1s, opacity 0.1s;
    }
    
    button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    .path-display {
      margin-bottom: 2rem;
    }
    
    .path-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      font-size: 0.9rem;
      flex-wrap: wrap;
    }
    
    .path-step {
      padding: 0.3rem 0.7rem;
      background: rgba(96, 165, 250, 0.2);
      border-radius: 6px;
      color: #60a5fa;
      font-weight: 500;
    }
    
    .path-arrow {
      color: #666;
    }
    
    .conversion-chain {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    
    .chain-step {
      display: flex;
      align-items: stretch;
      position: relative;
    }
    
    .chain-connector {
      width: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem 0;
    }
    
    .connector-line {
      width: 2px;
      flex-grow: 1;
      background: linear-gradient(180deg, #60a5fa, #a78bfa);
    }
    
    .connector-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: linear-gradient(135deg, #60a5fa, #a78bfa);
      border: 3px solid #1a1a2e;
      z-index: 1;
    }
    
    .chain-step:first-child .connector-line:first-child,
    .chain-step:last-child .connector-line:last-child {
      background: transparent;
    }
    
    .step-card {
      flex: 1;
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
      padding: 1.25rem;
      margin: 0.5rem 0;
    }
    
    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .step-name {
      font-size: 1.1rem;
      font-weight: 600;
    }
    
    .step-id {
      font-size: 0.75rem;
      color: #666;
      font-family: 'SF Mono', Monaco, monospace;
    }
    
    .step-content {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }
    
    .color-swatch {
      width: 100px;
      height: 80px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
    }
    
    .swatch-unavailable {
      background: repeating-linear-gradient(45deg, #222, #222 5px, #333 5px, #333 10px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      color: #666;
    }
    
    .step-values {
      flex: 1;
    }
    
    .coord-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.25rem;
    }
    
    .coord-item {
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 0.85rem;
    }
    
    .coord-label {
      color: #888;
      width: 20px;
      display: inline-block;
    }
    
    .coord-value {
      color: #60a5fa;
    }
    
    .css-value {
      margin-top: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: rgba(0,0,0,0.3);
      border-radius: 6px;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 0.75rem;
      color: #a78bfa;
      word-break: break-all;
    }
    
    .transform-label {
      position: absolute;
      left: 70px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(167, 139, 250, 0.2);
      color: #a78bfa;
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 600;
      white-space: nowrap;
      z-index: 2;
    }
    
    .graph-section {
      margin-top: 3rem;
      padding: 1.5rem;
      background: rgba(255,255,255,0.03);
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .graph-section h2 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      color: #a78bfa;
    }
    
    .graph-description {
      font-size: 0.85rem;
      color: #888;
      line-height: 1.6;
    }
    
    .space-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 0.5rem;
      margin-top: 1rem;
    }
    
    .space-chip {
      padding: 0.4rem 0.6rem;
      background: rgba(96, 165, 250, 0.1);
      border: 1px solid rgba(96, 165, 250, 0.3);
      border-radius: 6px;
      font-size: 0.75rem;
      text-align: center;
      color: #60a5fa;
    }
    
    .space-chip.hub {
      background: rgba(167, 139, 250, 0.2);
      border-color: rgba(167, 139, 250, 0.4);
      color: #a78bfa;
    }
    
    footer {
      margin-top: 3rem;
      text-align: center;
      color: #666;
      font-size: 0.85rem;
    }
    
    #no-path {
      padding: 2rem;
      text-align: center;
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 12px;
      display: none;
    }
  </style>
</head>
<body>
  <h1>🔀 Color Conversion Path Explorer</h1>
  <p class="subtitle">Visualize the automatic conversion chain between color spaces</p>
  
  <div class="controls">
    <div class="control-group">
      <label>From Space</label>
      <select id="from-space">
        ${colorSpaces.map(s => `<option value="${s.id}">${s.displayName}</option>`).join('\n        ')}
      </select>
    </div>
    
    <div class="control-group">
      <label>To Space</label>
      <select id="to-space">
        ${colorSpaces.map(s => `<option value="${s.id}" ${s.id === 'oklch' ? 'selected' : ''}>${s.displayName}</option>`).join('\n        ')}
      </select>
    </div>
    
    <div class="control-group">
      <label>Pick Color</label>
      <input type="color" id="color-picker" value="#ff6b6b">
    </div>
    
    <div class="control-group">
      <label>Or Enter Hex</label>
      <input type="text" id="hex-input" value="#ff6b6b" placeholder="#ff6b6b">
    </div>
    
    <div class="control-group" style="justify-content: flex-end;">
      <button onclick="updateConversion()">Convert →</button>
    </div>
  </div>
  
  <div class="path-display">
    <div class="path-header" id="path-header"></div>
    <div id="no-path">No conversion path found between these spaces!</div>
    <div class="conversion-chain" id="conversion-chain"></div>
  </div>
  
  <div class="graph-section">
    <h2>📊 Conversion Graph</h2>
    <p class="graph-description">
      The TokenScript interpreter automatically finds the shortest path between color spaces.
      <strong>XYZ-D65</strong> serves as the central hub, connecting most spaces.
      Some spaces (HSL, HSV, HWB) connect directly through sRGB.
    </p>
    <div class="space-grid">
      ${colorSpaces.map(s => `<div class="space-chip ${s.id === 'xyz-d65' ? 'hub' : ''}">${s.displayName}</div>`).join('\n      ')}
    </div>
  </div>
  
  <footer>
    <p>TokenScript Color Schema Registry • Path Explorer</p>
  </footer>
  
  <script>
    // Pre-computed paths from server
    const allPaths = ${JSON.stringify(allPaths, null, 2)};
    
    // Color space info
    const colorSpaces = ${JSON.stringify(colorSpaces.map(s => ({
      id: s.id,
      name: s.name,
      displayName: s.displayName,
      coords: s.coords,
      cssSupported: s.cssSupported,
    })), null, 2)};
    
    // Transform names between steps
    const transforms = {
      'srgb->srgb-linear': 'Gamma decode (^2.4)',
      'srgb-linear->srgb': 'Gamma encode (^1/2.4)',
      'srgb-linear->xyz-d65': 'Matrix (sRGB→XYZ)',
      'xyz-d65->srgb-linear': 'Matrix (XYZ→sRGB)',
      'xyz-d65->oklab': 'LMS cone response',
      'oklab->xyz-d65': 'Inverse LMS',
      'oklab->oklch': 'Cartesian→Polar',
      'oklch->oklab': 'Polar→Cartesian',
      'xyz-d65->xyz-d50': 'Bradford CAT (D65→D50)',
      'xyz-d50->xyz-d65': 'Bradford CAT (D50→D65)',
      'xyz-d50->lab': 'CIE Lab formula',
      'lab->xyz-d50': 'Inverse Lab',
      'lab->lch': 'Cartesian→Polar',
      'lch->lab': 'Polar→Cartesian',
      'srgb->hsl': 'RGB→HSL',
      'hsl->srgb': 'HSL→RGB',
      'srgb->hsv': 'RGB→HSV',
      'hsv->srgb': 'HSV→RGB',
      'srgb->hwb': 'RGB→HWB',
      'hwb->srgb': 'HWB→RGB',
      'xyz-d65->p3-linear': 'Matrix (XYZ→P3)',
      'p3-linear->xyz-d65': 'Matrix (P3→XYZ)',
      'p3-linear->p3': 'Gamma encode',
      'p3->p3-linear': 'Gamma decode',
    };
    
    function getTransformLabel(from, to) {
      const key = from + '->' + to;
      return transforms[key] || 'Convert';
    }
    
    function hexToRgb(hex) {
      const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      ] : [1, 0, 0];
    }
    
    function formatCoord(value, precision = 4) {
      if (value === undefined || value === null) return 'N/A';
      if (isNaN(value)) return 'NaN';
      return value.toFixed(precision);
    }
    
    function getCssColor(spaceId, coords) {
      if (coords.some(v => isNaN(v))) {
        // Replace NaN with 0 for display
        coords = coords.map(v => isNaN(v) ? 0 : v);
      }
      
      switch (spaceId) {
        case 'srgb':
          return \`color(srgb \${coords.map(v => v.toFixed(4)).join(' ')})\`;
        case 'srgb-linear':
          return \`color(srgb-linear \${coords.map(v => v.toFixed(4)).join(' ')})\`;
        case 'xyz-d65':
          return \`color(xyz-d65 \${coords.map(v => v.toFixed(4)).join(' ')})\`;
        case 'xyz-d50':
          return \`color(xyz-d50 \${coords.map(v => v.toFixed(4)).join(' ')})\`;
        case 'oklab':
          return \`oklab(\${coords[0].toFixed(4)} \${coords[1].toFixed(4)} \${coords[2].toFixed(4)})\`;
        case 'oklch':
          return \`oklch(\${coords[0].toFixed(4)} \${coords[1].toFixed(4)} \${coords[2].toFixed(2)})\`;
        case 'lab':
          return \`lab(\${coords[0].toFixed(2)} \${coords[1].toFixed(4)} \${coords[2].toFixed(4)})\`;
        case 'lch':
          return \`lch(\${coords[0].toFixed(2)} \${coords[1].toFixed(4)} \${coords[2].toFixed(2)})\`;
        case 'hsl':
          return \`hsl(\${coords[0].toFixed(1)} \${(coords[1] * 100).toFixed(1)}% \${(coords[2] * 100).toFixed(1)}%)\`;
        case 'hsv':
          return null; // No CSS support
        case 'hwb':
          return \`hwb(\${coords[0].toFixed(1)} \${(coords[1] * 100).toFixed(1)}% \${(coords[2] * 100).toFixed(1)}%)\`;
        case 'p3':
          return \`color(display-p3 \${coords.map(v => v.toFixed(4)).join(' ')})\`;
        default:
          return null;
      }
    }
    
    function updateConversion() {
      const fromSpace = document.getElementById('from-space').value;
      const toSpace = document.getElementById('to-space').value;
      const hexInput = document.getElementById('hex-input').value;
      
      // Get the path
      const path = allPaths[fromSpace]?.[toSpace];
      
      const pathHeader = document.getElementById('path-header');
      const noPath = document.getElementById('no-path');
      const chainContainer = document.getElementById('conversion-chain');
      
      if (!path) {
        pathHeader.innerHTML = '';
        noPath.style.display = 'block';
        chainContainer.innerHTML = '';
        return;
      }
      
      noPath.style.display = 'none';
      
      // Show path header
      pathHeader.innerHTML = '<strong>Path:</strong> ' + path.map((step, i) => {
        const space = colorSpaces.find(s => s.id === step);
        const html = \`<span class="path-step">\${space?.displayName || step}</span>\`;
        return i < path.length - 1 ? html + '<span class="path-arrow">→</span>' : html;
      }).join(' ');
      
      // Convert through each step using ColorJS
      const rgb = hexToRgb(hexInput);
      let currentColor = new Color('srgb', rgb);
      
      // Build chain HTML
      let chainHTML = '';
      
      for (let i = 0; i < path.length; i++) {
        const spaceId = path[i];
        const spaceInfo = colorSpaces.find(s => s.id === spaceId);
        
        // Convert to this space
        const converted = currentColor.to(spaceId);
        const coords = [...converted.coords];
        
        // Normalize HSL/HSV/HWB from 0-100 to 0-1
        if (spaceId === 'hsl' || spaceId === 'hsv' || spaceId === 'hwb') {
          coords[1] = coords[1] / 100;
          coords[2] = coords[2] / 100;
        }
        
        const cssColor = getCssColor(spaceId, coords);
        const canShowSwatch = spaceInfo?.cssSupported && cssColor;
        
        // Transform label for the connector
        const transformLabel = i > 0 ? getTransformLabel(path[i-1], spaceId) : null;
        
        chainHTML += \`
          <div class="chain-step">
            <div class="chain-connector">
              <div class="connector-line"></div>
              <div class="connector-dot"></div>
              <div class="connector-line"></div>
            </div>
            \${transformLabel ? \`<div class="transform-label">\${transformLabel}</div>\` : ''}
            <div class="step-card">
              <div class="step-header">
                <span class="step-name">\${spaceInfo?.displayName || spaceId}</span>
                <span class="step-id">\${spaceId}</span>
              </div>
              <div class="step-content">
                \${canShowSwatch 
                  ? \`<div class="color-swatch" style="background: \${cssColor}"></div>\`
                  : \`<div class="color-swatch swatch-unavailable">No CSS</div>\`
                }
                <div class="step-values">
                  <div class="coord-row">
                    \${spaceInfo?.coords.map((c, j) => \`
                      <span class="coord-item">
                        <span class="coord-label">\${c}:</span>
                        <span class="coord-value">\${formatCoord(coords[j])}</span>
                      </span>
                    \`).join('') || ''}
                  </div>
                  \${cssColor ? \`<div class="css-value">\${cssColor}</div>\` : ''}
                </div>
              </div>
            </div>
          </div>
        \`;
      }
      
      chainContainer.innerHTML = chainHTML;
    }
    
    // Sync color picker and hex input
    document.getElementById('color-picker').addEventListener('input', (e) => {
      document.getElementById('hex-input').value = e.target.value;
    });
    
    document.getElementById('hex-input').addEventListener('input', (e) => {
      const hex = e.target.value;
      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        document.getElementById('color-picker').value = hex;
      }
    });
    
    // Initial conversion
    updateConversion();
  </script>
</body>
</html>`;
}

// Generate and save
const html = generateHTML();
const outputPath = path.join(__dirname, "..", "demo", "path-explorer.html");
fs.writeFileSync(outputPath, html);

console.log(`✅ Path Explorer generated: ${outputPath}`);
console.log(`   Open: file://${outputPath}`);

