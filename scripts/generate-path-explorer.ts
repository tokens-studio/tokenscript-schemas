/**
 * Color Path Explorer Generator
 * Premium design for Tokens Studio
 */

import Color from "colorjs.io";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ColorSpaceInfo {
  id: string;
  displayName: string;
  coords: string[];
  cssSupported: boolean;
  parent?: string;
}

const colorSpaces: ColorSpaceInfo[] = [
  { id: "srgb", displayName: "sRGB", coords: ["R", "G", "B"], cssSupported: true },
  { id: "srgb-linear", displayName: "Linear sRGB", coords: ["R", "G", "B"], cssSupported: true, parent: "srgb" },
  { id: "xyz-d65", displayName: "XYZ D65", coords: ["X", "Y", "Z"], cssSupported: true, parent: "srgb-linear" },
  { id: "xyz-d50", displayName: "XYZ D50", coords: ["X", "Y", "Z"], cssSupported: true, parent: "xyz-d65" },
  { id: "oklab", displayName: "OKLab", coords: ["L", "a", "b"], cssSupported: true, parent: "xyz-d65" },
  { id: "oklch", displayName: "OKLCH", coords: ["L", "C", "H"], cssSupported: true, parent: "oklab" },
  { id: "lab", displayName: "Lab", coords: ["L", "a", "b"], cssSupported: true, parent: "xyz-d50" },
  { id: "lch", displayName: "LCH", coords: ["L", "C", "H"], cssSupported: true, parent: "lab" },
  { id: "hsl", displayName: "HSL", coords: ["H", "S", "L"], cssSupported: true, parent: "srgb" },
  { id: "hsv", displayName: "HSV", coords: ["H", "S", "V"], cssSupported: false, parent: "srgb" },
  { id: "hwb", displayName: "HWB", coords: ["H", "W", "B"], cssSupported: true, parent: "srgb" },
  { id: "p3", displayName: "Display P3", coords: ["R", "G", "B"], cssSupported: true, parent: "xyz-d65" },
];

function buildGraph(): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  for (const space of colorSpaces) graph.set(space.id, []);
  for (const space of colorSpaces) {
    if (space.parent) {
      graph.get(space.parent)?.push(space.id);
      graph.get(space.id)?.push(space.parent);
    }
  }
  return graph;
}

function findPath(from: string, to: string, graph: Map<string, string[]>): string[] | null {
  if (from === to) return [from];
  const visited = new Set<string>();
  const queue: { node: string; path: string[] }[] = [{ node: from, path: [from] }];
  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const neighbor of graph.get(node) || []) {
      const newPath = [...path, neighbor];
      if (neighbor === to) return newPath;
      queue.push({ node: neighbor, path: newPath });
    }
  }
  return null;
}

function generateHTML(): string {
  const graph = buildGraph();
  const allPaths: Record<string, Record<string, string[]>> = {};
  for (const from of colorSpaces) {
    allPaths[from.id] = {};
    for (const to of colorSpaces) {
      const path = findPath(from.id, to.id, graph);
      if (path) allPaths[from.id][to.id] = path;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Color Path Explorer — Tokens Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://colorjs.io/dist/color.global.js"></script>
  <style>
    :root {
      --bg-primary: #09090b;
      --bg-secondary: #18181b;
      --bg-tertiary: #27272a;
      --bg-elevated: #3f3f46;
      --border-subtle: rgba(255,255,255,0.06);
      --border-default: rgba(255,255,255,0.1);
      --text-primary: #fafafa;
      --text-secondary: #a1a1aa;
      --text-tertiary: #71717a;
      --accent: #a855f7;
      --accent-muted: rgba(168, 85, 247, 0.15);
      --success: #22c55e;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      line-height: 1.5;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 48px 32px;
    }
    
    /* Header */
    header {
      margin-bottom: 48px;
    }
    
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
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .brand-icon svg {
      width: 18px;
      height: 18px;
      fill: white;
    }
    
    h1 {
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    
    .subtitle {
      color: var(--text-tertiary);
      font-size: 14px;
    }
    
    /* Controls */
    .controls {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      margin-bottom: 32px;
    }
    
    .control-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .control-group label {
      font-size: 11px;
      font-weight: 500;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    select {
      appearance: none;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-sm);
      padding: 10px 32px 10px 12px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      cursor: pointer;
      min-width: 140px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      transition: border-color 0.15s, background-color 0.15s;
    }
    
    select:hover {
      background-color: var(--bg-elevated);
    }
    
    select:focus {
      outline: none;
      border-color: var(--accent);
    }
    
    .color-input-group {
      display: flex;
      align-items: flex-end;
      gap: 8px;
    }
    
    input[type="color"] {
      width: 42px;
      height: 42px;
      padding: 0;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      background: transparent;
    }
    
    input[type="color"]::-webkit-color-swatch-wrapper {
      padding: 0;
    }
    
    input[type="color"]::-webkit-color-swatch {
      border: 2px solid var(--border-default);
      border-radius: var(--radius-sm);
    }
    
    input[type="text"] {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: var(--text-primary);
      width: 90px;
      transition: border-color 0.15s;
    }
    
    input[type="text"]:focus {
      outline: none;
      border-color: var(--accent);
    }
    
    .spacer {
      flex: 1;
    }
    
    button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: var(--accent);
      border: none;
      border-radius: var(--radius-sm);
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      color: white;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s;
    }
    
    button:hover {
      opacity: 0.9;
    }
    
    button:active {
      transform: scale(0.98);
    }
    
    button svg {
      width: 14px;
      height: 14px;
    }
    
    /* Path visualization */
    .path-section {
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    
    .path-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(255,255,255,0.02);
    }
    
    .path-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .path-steps {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    
    .path-step {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 500;
      color: var(--accent);
      background: var(--accent-muted);
      padding: 4px 10px;
      border-radius: 100px;
    }
    
    .path-arrow {
      color: var(--text-tertiary);
      font-size: 11px;
    }
    
    .step-count {
      margin-left: auto;
      font-size: 12px;
      color: var(--text-tertiary);
    }
    
    /* Conversion chain */
    .chain {
      display: flex;
      align-items: stretch;
      padding: 24px;
      gap: 0;
      overflow-x: auto;
    }
    
    .chain::-webkit-scrollbar {
      height: 6px;
    }
    
    .chain::-webkit-scrollbar-track {
      background: var(--bg-tertiary);
      border-radius: 3px;
    }
    
    .chain::-webkit-scrollbar-thumb {
      background: var(--bg-elevated);
      border-radius: 3px;
    }
    
    .chain-item {
      display: flex;
      align-items: center;
    }
    
    .step-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: 16px;
      min-width: 120px;
      transition: border-color 0.15s;
    }
    
    .step-card:hover {
      border-color: var(--accent);
    }
    
    .step-name {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    
    .color-preview {
      width: 100%;
      aspect-ratio: 1;
      border-radius: var(--radius-sm);
      margin-bottom: 12px;
      position: relative;
      overflow: hidden;
    }
    
    .color-preview::before {
      content: '';
      position: absolute;
      inset: 0;
      background: 
        linear-gradient(45deg, #333 25%, transparent 25%),
        linear-gradient(-45deg, #333 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #333 75%),
        linear-gradient(-45deg, transparent 75%, #333 75%);
      background-size: 8px 8px;
      background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
      opacity: 0.5;
      z-index: 0;
    }
    
    .color-preview-inner {
      position: absolute;
      inset: 0;
      z-index: 1;
    }
    
    .no-css {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      z-index: 2;
    }
    
    .coords {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .coord-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
    }
    
    .coord-label {
      color: var(--text-tertiary);
    }
    
    .coord-value {
      color: var(--text-primary);
      font-weight: 500;
    }
    
    /* Arrow connector */
    .connector {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 8px;
      min-width: 60px;
    }
    
    .connector-line {
      display: flex;
      align-items: center;
    }
    
    .connector-line::before {
      content: '';
      width: 24px;
      height: 1px;
      background: var(--border-default);
    }
    
    .connector-line::after {
      content: '';
      width: 0;
      height: 0;
      border-top: 4px solid transparent;
      border-bottom: 4px solid transparent;
      border-left: 6px solid var(--text-tertiary);
    }
    
    .transform-name {
      font-size: 9px;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-top: 6px;
      text-align: center;
      white-space: nowrap;
    }
    
    /* Empty state */
    #no-path {
      display: none;
      padding: 48px;
      text-align: center;
      color: var(--text-tertiary);
    }
    
    /* Footer info */
    .info-section {
      margin-top: 32px;
      padding: 20px 24px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
    }
    
    .info-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    
    .info-text {
      font-size: 13px;
      color: var(--text-tertiary);
      line-height: 1.6;
      margin-bottom: 16px;
    }
    
    .space-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .space-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: var(--text-secondary);
      background: var(--bg-tertiary);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
    }
    
    .space-tag.hub {
      color: var(--accent);
      background: var(--accent-muted);
      border-color: transparent;
    }
    
    footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--text-tertiary);
    }
    
    .footer-brand img {
      height: 16px;
      opacity: 0.5;
    }
    
    .footer-links {
      display: flex;
      gap: 16px;
    }
    
    .footer-links a {
      font-size: 12px;
      color: var(--text-tertiary);
      text-decoration: none;
      transition: color 0.15s;
    }
    
    .footer-links a:hover {
      color: var(--text-secondary);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        </div>
        <h1>Color Path Explorer</h1>
      </div>
      <p class="subtitle">Visualize color space conversion paths</p>
    </header>
    
    <div class="controls">
      <div class="control-group">
        <label>From</label>
        <select id="from-space">
          ${colorSpaces.map(s => `<option value="${s.id}">${s.displayName}</option>`).join('\n          ')}
        </select>
      </div>
      
      <div class="control-group">
        <label>To</label>
        <select id="to-space">
          ${colorSpaces.map(s => `<option value="${s.id}" ${s.id === 'oklch' ? 'selected' : ''}>${s.displayName}</option>`).join('\n          ')}
        </select>
      </div>
      
      <div class="control-group">
        <label>Color</label>
        <div class="color-input-group">
          <input type="color" id="color-picker" value="#a855f7">
          <input type="text" id="hex-input" value="#a855f7" spellcheck="false">
        </div>
      </div>
      
      <div class="spacer"></div>
      
      <button onclick="updateConversion()">
        Convert
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
    
    <div class="path-section">
      <div class="path-header">
        <span class="path-label">Path</span>
        <div class="path-steps" id="path-steps"></div>
        <span class="step-count" id="step-count"></span>
      </div>
      <div id="no-path">No conversion path available</div>
      <div class="chain" id="chain"></div>
    </div>
    
    <div class="info-section">
      <div class="info-title">Conversion Graph</div>
      <p class="info-text">
        Colors are converted through a graph of color spaces. <strong>XYZ D65</strong> is the central hub connecting most perceptual spaces.
        HSL, HSV, and HWB connect directly through sRGB.
      </p>
      <div class="space-tags">
        ${colorSpaces.map(s => `<span class="space-tag ${s.id === 'xyz-d65' ? 'hub' : ''}">${s.displayName}</span>`).join('\n        ')}
      </div>
    </div>
    
    <footer>
      <div class="footer-brand">
        <span>Tokens Studio</span>
        <span>·</span>
        <span>Color Schema Registry</span>
      </div>
      <div class="footer-links">
        <a href="color-comparison.html">Parity Tests</a>
        <a href="advanced-tests.html">Advanced Tests</a>
      </div>
    </footer>
  </div>
  
  <script>
    const allPaths = ${JSON.stringify(allPaths)};
    const colorSpaces = ${JSON.stringify(colorSpaces)};
    
    const transforms = {
      'srgb->srgb-linear': 'Linearize',
      'srgb-linear->srgb': 'Gamma',
      'srgb-linear->xyz-d65': 'Matrix',
      'xyz-d65->srgb-linear': 'Matrix',
      'xyz-d65->oklab': 'LMS',
      'oklab->xyz-d65': 'LMS⁻¹',
      'oklab->oklch': 'Polar',
      'oklch->oklab': 'Rect',
      'xyz-d65->xyz-d50': 'Bradford',
      'xyz-d50->xyz-d65': 'Bradford',
      'xyz-d50->lab': 'Lab',
      'lab->xyz-d50': 'Lab⁻¹',
      'lab->lch': 'Polar',
      'lch->lab': 'Rect',
      'srgb->hsl': 'HSL',
      'hsl->srgb': 'RGB',
      'srgb->hsv': 'HSV',
      'hsv->srgb': 'RGB',
      'srgb->hwb': 'HWB',
      'hwb->srgb': 'RGB',
      'xyz-d65->p3': 'Matrix',
      'p3->xyz-d65': 'Matrix',
    };
    
    function getTransform(from, to) {
      return transforms[from + '->' + to] || '→';
    }
    
    function hexToRgb(hex) {
      const r = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
      return r ? [parseInt(r[1],16)/255, parseInt(r[2],16)/255, parseInt(r[3],16)/255] : [0.66,0.33,0.97];
    }
    
    function fmt(v, d=4) {
      if (v === undefined || v === null || isNaN(v)) return '—';
      return v.toFixed(d);
    }
    
    function getCss(spaceId, coords) {
      const c = coords.map(v => isNaN(v) ? 0 : v);
      switch (spaceId) {
        case 'srgb': return \`color(srgb \${c.map(v=>v.toFixed(3)).join(' ')})\`;
        case 'srgb-linear': return \`color(srgb-linear \${c.map(v=>v.toFixed(3)).join(' ')})\`;
        case 'xyz-d65': return \`color(xyz-d65 \${c.map(v=>v.toFixed(3)).join(' ')})\`;
        case 'xyz-d50': return \`color(xyz-d50 \${c.map(v=>v.toFixed(3)).join(' ')})\`;
        case 'oklab': return \`oklab(\${c[0].toFixed(3)} \${c[1].toFixed(3)} \${c[2].toFixed(3)})\`;
        case 'oklch': return \`oklch(\${c[0].toFixed(3)} \${c[1].toFixed(3)} \${c[2].toFixed(1)})\`;
        case 'lab': return \`lab(\${c[0].toFixed(1)} \${c[1].toFixed(2)} \${c[2].toFixed(2)})\`;
        case 'lch': return \`lch(\${c[0].toFixed(1)} \${c[1].toFixed(2)} \${c[2].toFixed(1)})\`;
        case 'hsl': return \`hsl(\${c[0].toFixed(1)} \${(c[1]*100).toFixed(1)}% \${(c[2]*100).toFixed(1)}%)\`;
        case 'hwb': return \`hwb(\${c[0].toFixed(1)} \${(c[1]*100).toFixed(1)}% \${(c[2]*100).toFixed(1)}%)\`;
        case 'p3': return \`color(display-p3 \${c.map(v=>v.toFixed(3)).join(' ')})\`;
        default: return null;
      }
    }
    
    function updateConversion() {
      const fromSpace = document.getElementById('from-space').value;
      const toSpace = document.getElementById('to-space').value;
      const hexInput = document.getElementById('hex-input').value;
      
      const path = allPaths[fromSpace]?.[toSpace];
      const pathSteps = document.getElementById('path-steps');
      const stepCount = document.getElementById('step-count');
      const noPath = document.getElementById('no-path');
      const chain = document.getElementById('chain');
      
      if (!path) {
        pathSteps.innerHTML = '';
        stepCount.textContent = '';
        noPath.style.display = 'block';
        chain.style.display = 'none';
        return;
      }
      
      noPath.style.display = 'none';
      chain.style.display = 'flex';
      
      // Path header
      pathSteps.innerHTML = path.map((step, i) => {
        const sp = colorSpaces.find(s => s.id === step);
        const html = \`<span class="path-step">\${sp?.displayName || step}</span>\`;
        return i < path.length - 1 ? html + '<span class="path-arrow">→</span>' : html;
      }).join(' ');
      
      stepCount.textContent = \`\${path.length} step\${path.length > 1 ? 's' : ''}\`;
      
      // Build chain
      const rgb = hexToRgb(hexInput);
      let currentColor = new Color('srgb', rgb);
      let chainHTML = '';
      
      for (let i = 0; i < path.length; i++) {
        const spaceId = path[i];
        const spaceInfo = colorSpaces.find(s => s.id === spaceId);
        const converted = currentColor.to(spaceId);
        const coords = [...converted.coords];
        
        if (['hsl', 'hsv', 'hwb'].includes(spaceId)) {
          coords[1] = coords[1] / 100;
          coords[2] = coords[2] / 100;
        }
        
        const css = getCss(spaceId, coords);
        const canShow = spaceInfo?.cssSupported && css;
        
        // Connector (except first)
        if (i > 0) {
          const transform = getTransform(path[i-1], spaceId);
          chainHTML += \`
            <div class="connector">
              <div class="connector-line"></div>
              <div class="transform-name">\${transform}</div>
            </div>
          \`;
        }
        
        // Card
        chainHTML += \`
          <div class="chain-item">
            <div class="step-card">
              <div class="step-name">\${spaceInfo?.displayName || spaceId}</div>
              <div class="color-preview">
                \${canShow 
                  ? \`<div class="color-preview-inner" style="background: \${css}"></div>\`
                  : \`<div class="no-css">No CSS</div>\`
                }
              </div>
              <div class="coords">
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
      updateConversion();
    });
    
    document.getElementById('hex-input').addEventListener('input', e => {
      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
        document.getElementById('color-picker').value = e.target.value;
        updateConversion();
      }
    });
    
    // Auto-update on select change
    document.getElementById('from-space').addEventListener('change', updateConversion);
    document.getElementById('to-space').addEventListener('change', updateConversion);
    
    updateConversion();
  </script>
</body>
</html>`;
}

const html = generateHTML();
const outputPath = path.join(__dirname, "..", "demo", "path-explorer.html");
fs.writeFileSync(outputPath, html);
console.log(`✅ Path Explorer generated: ${outputPath}`);
