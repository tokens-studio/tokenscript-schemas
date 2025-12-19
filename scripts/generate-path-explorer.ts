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
  parent?: string;
}

const colorSpaces: ColorSpaceInfo[] = [
  { id: "srgb", name: "SRGB", displayName: "sRGB", coords: ["r", "g", "b"], cssSupported: true },
  { id: "srgb-linear", name: "LinearSRGB", displayName: "Linear sRGB", coords: ["r", "g", "b"], cssSupported: true, parent: "srgb" },
  { id: "xyz-d65", name: "XYZD65", displayName: "XYZ D65", coords: ["x", "y", "z"], cssSupported: true, parent: "srgb-linear" },
  { id: "xyz-d50", name: "XYZD50", displayName: "XYZ D50", coords: ["x", "y", "z"], cssSupported: true, parent: "xyz-d65" },
  { id: "oklab", name: "OKLab", displayName: "OKLab", coords: ["L", "a", "b"], cssSupported: true, parent: "xyz-d65" },
  { id: "oklch", name: "OKLCH", displayName: "OKLCH", coords: ["L", "C", "H"], cssSupported: true, parent: "oklab" },
  { id: "lab", name: "Lab", displayName: "CIE Lab", coords: ["L", "a", "b"], cssSupported: true, parent: "xyz-d50" },
  { id: "lch", name: "LCH", displayName: "CIE LCH", coords: ["L", "C", "H"], cssSupported: true, parent: "lab" },
  { id: "hsl", name: "HSL", displayName: "HSL", coords: ["H", "S", "L"], cssSupported: true, parent: "srgb" },
  { id: "hsv", name: "HSV", displayName: "HSV", coords: ["H", "S", "V"], cssSupported: false, parent: "srgb" },
  { id: "hwb", name: "HWB", displayName: "HWB", coords: ["H", "W", "B"], cssSupported: true, parent: "srgb" },
  { id: "p3", name: "P3", displayName: "Display P3", coords: ["r", "g", "b"], cssSupported: true, parent: "xyz-d65" },
];

// Build the conversion graph
function buildConversionGraph(): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  
  for (const space of colorSpaces) {
    graph.set(space.id, []);
  }
  
  for (const space of colorSpaces) {
    if (space.parent) {
      graph.get(space.parent)?.push(space.id);
      graph.get(space.id)?.push(space.parent);
    }
  }
  
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
      font-size: 2rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .subtitle {
      color: #888;
      margin-bottom: 2rem;
      font-size: 0.9rem;
    }
    
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1.25rem;
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
      align-items: flex-end;
    }
    
    .control-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    
    .control-group label {
      font-size: 0.7rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    select, input[type="text"] {
      padding: 0.6rem 0.8rem;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(0,0,0,0.3);
      color: #fff;
      font-size: 0.9rem;
      min-width: 130px;
    }
    
    input[type="color"] {
      width: 50px;
      height: 38px;
      padding: 2px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(0,0,0,0.3);
      cursor: pointer;
    }
    
    button {
      padding: 0.6rem 1.2rem;
      border-radius: 6px;
      border: none;
      background: linear-gradient(135deg, #60a5fa, #a78bfa);
      color: white;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: transform 0.1s, opacity 0.1s;
    }
    
    button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    /* Horizontal conversion chain */
    .conversion-chain {
      display: flex;
      align-items: stretch;
      gap: 0;
      overflow-x: auto;
      padding: 1rem 0;
    }
    
    .chain-item {
      display: flex;
      align-items: center;
    }
    
    .step-card {
      background: rgba(255,255,255,0.04);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.1);
      padding: 1rem;
      min-width: 140px;
      max-width: 160px;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .step-header {
      text-align: center;
    }
    
    .step-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #fff;
    }
    
    .color-swatch {
      width: 100%;
      height: 50px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.15);
    }
    
    .swatch-unavailable {
      background: repeating-linear-gradient(45deg, #222, #222 4px, #333 4px, #333 8px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      color: #666;
    }
    
    .step-values {
      font-family: 'SF Mono', Monaco, 'Consolas', monospace;
      font-size: 0.7rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    
    .coord-row {
      display: flex;
      justify-content: space-between;
      color: #999;
    }
    
    .coord-label {
      color: #666;
    }
    
    .coord-value {
      color: #60a5fa;
    }
    
    /* Arrow connector between cards */
    .arrow-connector {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 0.5rem;
      min-width: 70px;
    }
    
    .arrow-line {
      width: 30px;
      height: 2px;
      background: linear-gradient(90deg, #60a5fa, #a78bfa);
    }
    
    .arrow-head {
      width: 0;
      height: 0;
      border-top: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-left: 8px solid #a78bfa;
      margin-left: -1px;
    }
    
    .arrow-top {
      display: flex;
      align-items: center;
    }
    
    .transform-label {
      font-size: 0.6rem;
      color: #a78bfa;
      text-align: center;
      margin-top: 0.4rem;
      line-height: 1.3;
      max-width: 80px;
    }
    
    /* Path header */
    .path-header {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    
    .path-step {
      padding: 0.25rem 0.5rem;
      background: rgba(96, 165, 250, 0.15);
      border-radius: 4px;
      color: #60a5fa;
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    .path-arrow {
      color: #666;
      font-size: 0.8rem;
    }
    
    /* Graph section */
    .graph-section {
      margin-top: 2rem;
      padding: 1.25rem;
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .graph-section h2 {
      font-size: 1rem;
      margin-bottom: 0.75rem;
      color: #a78bfa;
    }
    
    .graph-description {
      font-size: 0.8rem;
      color: #888;
      line-height: 1.5;
      margin-bottom: 1rem;
    }
    
    .space-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    
    .space-chip {
      padding: 0.3rem 0.5rem;
      background: rgba(96, 165, 250, 0.1);
      border: 1px solid rgba(96, 165, 250, 0.25);
      border-radius: 4px;
      font-size: 0.7rem;
      color: #60a5fa;
    }
    
    .space-chip.hub {
      background: rgba(167, 139, 250, 0.15);
      border-color: rgba(167, 139, 250, 0.35);
      color: #a78bfa;
      font-weight: 600;
    }
    
    #no-path {
      padding: 1.5rem;
      text-align: center;
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 10px;
      display: none;
      font-size: 0.9rem;
    }
    
    footer {
      margin-top: 2rem;
      text-align: center;
      color: #555;
      font-size: 0.75rem;
    }
  </style>
</head>
<body>
  <h1>🔀 Color Conversion Path Explorer</h1>
  <p class="subtitle">Visualize the automatic conversion chain between color spaces</p>
  
  <div class="controls">
    <div class="control-group">
      <label>From</label>
      <select id="from-space">
        ${colorSpaces.map(s => `<option value="${s.id}">${s.displayName}</option>`).join('\n        ')}
      </select>
    </div>
    
    <div class="control-group">
      <label>To</label>
      <select id="to-space">
        ${colorSpaces.map(s => `<option value="${s.id}" ${s.id === 'oklch' ? 'selected' : ''}>${s.displayName}</option>`).join('\n        ')}
      </select>
    </div>
    
    <div class="control-group">
      <label>Color</label>
      <input type="color" id="color-picker" value="#ff6b6b">
    </div>
    
    <div class="control-group">
      <label>Hex</label>
      <input type="text" id="hex-input" value="#ff6b6b" placeholder="#ff6b6b" style="width: 100px;">
    </div>
    
    <button onclick="updateConversion()">Convert →</button>
  </div>
  
  <div class="path-header" id="path-header"></div>
  <div id="no-path">No conversion path found between these spaces!</div>
  <div class="conversion-chain" id="conversion-chain"></div>
  
  <div class="graph-section">
    <h2>📊 Conversion Graph</h2>
    <p class="graph-description">
      <strong>XYZ D65</strong> is the central hub connecting most spaces. HSL, HSV, HWB connect directly through sRGB.
    </p>
    <div class="space-grid">
      ${colorSpaces.map(s => `<span class="space-chip ${s.id === 'xyz-d65' ? 'hub' : ''}">${s.displayName}</span>`).join('\n      ')}
    </div>
  </div>
  
  <footer>TokenScript Color Schema Registry • Path Explorer</footer>
  
  <script>
    const allPaths = ${JSON.stringify(allPaths)};
    
    const colorSpaces = ${JSON.stringify(colorSpaces.map(s => ({
      id: s.id,
      displayName: s.displayName,
      coords: s.coords,
      cssSupported: s.cssSupported,
    })))};
    
    const transforms = {
      'srgb->srgb-linear': 'γ decode',
      'srgb-linear->srgb': 'γ encode',
      'srgb-linear->xyz-d65': 'Matrix',
      'xyz-d65->srgb-linear': 'Matrix⁻¹',
      'xyz-d65->oklab': 'LMS',
      'oklab->xyz-d65': 'LMS⁻¹',
      'oklab->oklch': 'Polar',
      'oklch->oklab': 'Cartesian',
      'xyz-d65->xyz-d50': 'Bradford',
      'xyz-d50->xyz-d65': 'Bradford⁻¹',
      'xyz-d50->lab': 'CIE Lab',
      'lab->xyz-d50': 'CIE Lab⁻¹',
      'lab->lch': 'Polar',
      'lch->lab': 'Cartesian',
      'srgb->hsl': 'HSL',
      'hsl->srgb': 'HSL⁻¹',
      'srgb->hsv': 'HSV',
      'hsv->srgb': 'HSV⁻¹',
      'srgb->hwb': 'HWB',
      'hwb->srgb': 'HWB⁻¹',
      'xyz-d65->p3': 'P3 Matrix',
      'p3->xyz-d65': 'P3 Matrix⁻¹',
    };
    
    function getTransform(from, to) {
      return transforms[from + '->' + to] || '→';
    }
    
    function hexToRgb(hex) {
      const r = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
      return r ? [parseInt(r[1], 16)/255, parseInt(r[2], 16)/255, parseInt(r[3], 16)/255] : [1,0,0];
    }
    
    function fmt(v, d=4) {
      if (v === undefined || v === null || isNaN(v)) return 'NaN';
      return v.toFixed(d);
    }
    
    function getCss(spaceId, coords) {
      const c = coords.map(v => isNaN(v) ? 0 : v);
      switch (spaceId) {
        case 'srgb': return \`color(srgb \${c.map(v=>fmt(v,3)).join(' ')})\`;
        case 'srgb-linear': return \`color(srgb-linear \${c.map(v=>fmt(v,3)).join(' ')})\`;
        case 'xyz-d65': return \`color(xyz-d65 \${c.map(v=>fmt(v,3)).join(' ')})\`;
        case 'xyz-d50': return \`color(xyz-d50 \${c.map(v=>fmt(v,3)).join(' ')})\`;
        case 'oklab': return \`oklab(\${fmt(c[0],3)} \${fmt(c[1],3)} \${fmt(c[2],3)})\`;
        case 'oklch': return \`oklch(\${fmt(c[0],3)} \${fmt(c[1],3)} \${fmt(c[2],1)})\`;
        case 'lab': return \`lab(\${fmt(c[0],1)} \${fmt(c[1],2)} \${fmt(c[2],2)})\`;
        case 'lch': return \`lch(\${fmt(c[0],1)} \${fmt(c[1],2)} \${fmt(c[2],1)})\`;
        case 'hsl': return \`hsl(\${fmt(c[0],1)} \${fmt(c[1]*100,1)}% \${fmt(c[2]*100,1)}%)\`;
        case 'hwb': return \`hwb(\${fmt(c[0],1)} \${fmt(c[1]*100,1)}% \${fmt(c[2]*100,1)}%)\`;
        case 'p3': return \`color(display-p3 \${c.map(v=>fmt(v,3)).join(' ')})\`;
        default: return null;
      }
    }
    
    function updateConversion() {
      const fromSpace = document.getElementById('from-space').value;
      const toSpace = document.getElementById('to-space').value;
      const hexInput = document.getElementById('hex-input').value;
      
      const path = allPaths[fromSpace]?.[toSpace];
      const pathHeader = document.getElementById('path-header');
      const noPath = document.getElementById('no-path');
      const chain = document.getElementById('conversion-chain');
      
      if (!path) {
        pathHeader.innerHTML = '';
        noPath.style.display = 'block';
        chain.innerHTML = '';
        return;
      }
      
      noPath.style.display = 'none';
      
      // Path header
      pathHeader.innerHTML = path.map((step, i) => {
        const sp = colorSpaces.find(s => s.id === step);
        const html = \`<span class="path-step">\${sp?.displayName || step}</span>\`;
        return i < path.length - 1 ? html + '<span class="path-arrow">→</span>' : html;
      }).join(' ');
      
      // Build chain
      const rgb = hexToRgb(hexInput);
      let currentColor = new Color('srgb', rgb);
      let chainHTML = '';
      
      for (let i = 0; i < path.length; i++) {
        const spaceId = path[i];
        const spaceInfo = colorSpaces.find(s => s.id === spaceId);
        const converted = currentColor.to(spaceId);
        const coords = [...converted.coords];
        
        // Normalize HSL/HSV/HWB
        if (['hsl', 'hsv', 'hwb'].includes(spaceId)) {
          coords[1] = coords[1] / 100;
          coords[2] = coords[2] / 100;
        }
        
        const css = getCss(spaceId, coords);
        const canShow = spaceInfo?.cssSupported && css;
        
        // Add arrow before card (except first)
        if (i > 0) {
          const transform = getTransform(path[i-1], spaceId);
          chainHTML += \`
            <div class="arrow-connector">
              <div class="arrow-top">
                <div class="arrow-line"></div>
                <div class="arrow-head"></div>
              </div>
              <div class="transform-label">\${transform}</div>
            </div>
          \`;
        }
        
        // Card
        chainHTML += \`
          <div class="chain-item">
            <div class="step-card">
              <div class="step-header">
                <div class="step-name">\${spaceInfo?.displayName || spaceId}</div>
              </div>
              \${canShow 
                ? \`<div class="color-swatch" style="background: \${css}"></div>\`
                : \`<div class="color-swatch swatch-unavailable">No CSS</div>\`
              }
              <div class="step-values">
                \${spaceInfo?.coords.map((c, j) => \`
                  <div class="coord-row">
                    <span class="coord-label">\${c}</span>
                    <span class="coord-value">\${fmt(coords[j], 4)}</span>
                  </div>
                \`).join('') || ''}
              </div>
            </div>
          </div>
        \`;
      }
      
      chain.innerHTML = chainHTML;
    }
    
    // Sync inputs
    document.getElementById('color-picker').addEventListener('input', e => {
      document.getElementById('hex-input').value = e.target.value;
    });
    document.getElementById('hex-input').addEventListener('input', e => {
      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
        document.getElementById('color-picker').value = e.target.value;
      }
    });
    
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
