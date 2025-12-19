/**
 * Advanced Color Demo Generator
 * 
 * Tests edge cases, gamut mapping, round-trips, and problematic colors
 */

import Color from "colorjs.io";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface TestResult {
  category: string;
  name: string;
  description: string;
  input: { space: string; coords: number[] };
  output: { space: string; coords: number[] };
  reference: { space: string; coords: number[] };
  inGamut: boolean;
  css: { input: string | null; output: string | null };
  notes: string;
}

// Test categories with interesting color science cases
const testCases: TestResult[] = [];

// ============================================
// 1. WIDE GAMUT COLORS (Outside sRGB)
// ============================================
const wideGamutColors = [
  {
    name: "P3 Electric Green",
    description: "P3's most saturated green - impossible in sRGB",
    p3: [0, 1, 0],
  },
  {
    name: "P3 Vivid Cyan",
    description: "Saturated cyan in P3 gamut",
    p3: [0, 0.9, 0.9],
  },
  {
    name: "P3 Hot Pink",
    description: "Vibrant pink only possible in P3",
    p3: [1, 0.2, 0.6],
  },
  {
    name: "P3 Deep Orange",
    description: "Extra saturated orange",
    p3: [1, 0.4, 0],
  },
];

for (const color of wideGamutColors) {
  const p3Color = new Color("p3", color.p3);
  const srgbColor = p3Color.to("srgb");
  const inGamut = srgbColor.inGamut();

  testCases.push({
    category: "Wide Gamut (P3 → sRGB)",
    name: color.name,
    description: color.description,
    input: { space: "p3", coords: color.p3 },
    output: { space: "srgb", coords: [...srgbColor.coords] },
    reference: { space: "srgb", coords: [...srgbColor.coords] },
    inGamut,
    css: {
      input: `color(display-p3 ${color.p3.join(" ")})`,
      output: inGamut
        ? `color(srgb ${srgbColor.coords.map((c) => c.toFixed(4)).join(" ")})`
        : null,
    },
    notes: inGamut
      ? "Within sRGB gamut"
      : `Out of gamut! RGB has negative values: [${srgbColor.coords.map((c) => c.toFixed(3)).join(", ")}]`,
  });
}

// ============================================
// 2. ROUND-TRIP TESTS
// ============================================
const roundTripColors = [
  { name: "Pure Red", srgb: [1, 0, 0] },
  { name: "Pure Green", srgb: [0, 1, 0] },
  { name: "Pure Blue", srgb: [0, 0, 1] },
  { name: "Mid Gray", srgb: [0.5, 0.5, 0.5] },
  { name: "Coral", srgb: [1, 0.5, 0.31] },
  { name: "Skin Tone Light", srgb: [0.96, 0.80, 0.69] },
  { name: "Skin Tone Medium", srgb: [0.78, 0.57, 0.44] },
  { name: "Skin Tone Dark", srgb: [0.36, 0.22, 0.15] },
];

for (const color of roundTripColors) {
  // Round trip: sRGB → OKLCH → sRGB
  const original = new Color("srgb", color.srgb);
  const oklch = original.to("oklch");
  const roundTrip = oklch.to("srgb");

  const maxDiff = Math.max(
    ...color.srgb.map((v, i) => Math.abs(v - roundTrip.coords[i])),
  );

  testCases.push({
    category: "Round-Trip (sRGB → OKLCH → sRGB)",
    name: color.name,
    description: `Test lossless conversion through OKLCH`,
    input: { space: "srgb", coords: color.srgb },
    output: { space: "srgb", coords: [...roundTrip.coords] },
    reference: { space: "oklch", coords: [...oklch.coords] },
    inGamut: true,
    css: {
      input: `color(srgb ${color.srgb.join(" ")})`,
      output: `color(srgb ${roundTrip.coords.map((c) => c.toFixed(6)).join(" ")})`,
    },
    notes:
      maxDiff < 1e-10
        ? "✅ Perfect round-trip"
        : `⚠️ Δ max: ${maxDiff.toExponential(2)}`,
  });
}

// ============================================
// 3. PROBLEMATIC COLORS (Hue Shifts)
// ============================================
const problematicColors = [
  {
    name: "Blue-Violet Boundary",
    description: "Hue often shifts in this region",
    oklch: [0.5, 0.15, 270],
  },
  {
    name: "Yellow-Green Boundary",
    description: "Tricky hue interpolation area",
    oklch: [0.85, 0.18, 110],
  },
  {
    name: "Red-Magenta Boundary",
    description: "Hue discontinuity near 360°",
    oklch: [0.6, 0.2, 350],
  },
  {
    name: "Pure Violet",
    description: "Often loses saturation in conversions",
    oklch: [0.45, 0.2, 300],
  },
];

for (const color of problematicColors) {
  const oklchColor = new Color("oklch", color.oklch);
  const labColor = oklchColor.to("lab");
  const backToOklch = labColor.to("oklch");

  const hueDiff = Math.abs(color.oklch[2] - (backToOklch.coords[2] || 0));

  testCases.push({
    category: "Problematic Hues (OKLCH → Lab → OKLCH)",
    name: color.name,
    description: color.description,
    input: { space: "oklch", coords: color.oklch },
    output: { space: "oklch", coords: [...backToOklch.coords] },
    reference: { space: "lab", coords: [...labColor.coords] },
    inGamut: oklchColor.to("srgb").inGamut(),
    css: {
      input: `oklch(${color.oklch[0]} ${color.oklch[1]} ${color.oklch[2]})`,
      output: `oklch(${backToOklch.coords[0]?.toFixed(4)} ${backToOklch.coords[1]?.toFixed(4)} ${backToOklch.coords[2]?.toFixed(2) || "none"})`,
    },
    notes:
      hueDiff < 0.01
        ? "✅ Hue preserved"
        : `⚠️ Hue shift: ${hueDiff.toFixed(2)}°`,
  });
}

// ============================================
// 4. MAXIMUM CHROMA COLORS
// ============================================
const maxChromaHues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

for (const hue of maxChromaHues) {
  // Find max in-gamut chroma at this hue
  let maxChroma = 0.4;
  let testColor = new Color("oklch", [0.7, maxChroma, hue]);

  while (testColor.to("srgb").inGamut() && maxChroma < 0.5) {
    maxChroma += 0.01;
    testColor = new Color("oklch", [0.7, maxChroma, hue]);
  }
  maxChroma -= 0.01; // Back to last in-gamut

  const inGamutColor = new Color("oklch", [0.7, maxChroma, hue]);
  const srgbColor = inGamutColor.to("srgb");

  testCases.push({
    category: "Maximum Chroma (at L=0.7)",
    name: `Hue ${hue}°`,
    description: `Most saturated in-gamut color at hue ${hue}°`,
    input: { space: "oklch", coords: [0.7, maxChroma, hue] },
    output: { space: "srgb", coords: [...srgbColor.coords] },
    reference: { space: "oklch", coords: [0.7, maxChroma, hue] },
    inGamut: true,
    css: {
      input: `oklch(0.7 ${maxChroma.toFixed(3)} ${hue})`,
      output: `color(srgb ${srgbColor.coords.map((c) => c.toFixed(4)).join(" ")})`,
    },
    notes: `Max chroma: ${maxChroma.toFixed(3)}`,
  });
}

// ============================================
// 5. GRAY RAMP (Achromatic)
// ============================================
const grayLevels = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

for (const L of grayLevels) {
  const srgbGray = new Color("srgb", [L, L, L]);
  const oklchGray = srgbGray.to("oklch");

  testCases.push({
    category: "Gray Ramp (Achromatic)",
    name: `L* = ${(L * 100).toFixed(0)}%`,
    description: `Achromatic gray - chroma should be ~0`,
    input: { space: "srgb", coords: [L, L, L] },
    output: { space: "oklch", coords: [...oklchGray.coords] },
    reference: { space: "oklch", coords: [...oklchGray.coords] },
    inGamut: true,
    css: {
      input: `color(srgb ${L} ${L} ${L})`,
      output: `oklch(${oklchGray.coords[0]?.toFixed(4)} ${oklchGray.coords[1]?.toFixed(6)} ${oklchGray.coords[2] || "none"})`,
    },
    notes:
      (oklchGray.coords[1] || 0) < 1e-10
        ? "✅ Perfectly achromatic"
        : `⚠️ Residual chroma: ${oklchGray.coords[1]?.toExponential(2)}`,
  });
}

// ============================================
// 6. EDGE CASES
// ============================================
const edgeCases = [
  {
    name: "Absolute Black",
    description: "RGB (0,0,0) - all channels at minimum",
    srgb: [0, 0, 0],
  },
  {
    name: "Absolute White",
    description: "RGB (1,1,1) - all channels at maximum",
    srgb: [1, 1, 1],
  },
  {
    name: "Near-Black",
    description: "Very dark - tests precision",
    srgb: [0.001, 0.001, 0.001],
  },
  {
    name: "Near-White",
    description: "Very bright - tests precision",
    srgb: [0.999, 0.999, 0.999],
  },
  {
    name: "Threshold Boundary",
    description: "sRGB linear/gamma threshold (0.04045)",
    srgb: [0.04045, 0.04045, 0.04045],
  },
];

for (const color of edgeCases) {
  const srgbColor = new Color("srgb", color.srgb);
  const xyzColor = srgbColor.to("xyz-d65");

  testCases.push({
    category: "Edge Cases",
    name: color.name,
    description: color.description,
    input: { space: "srgb", coords: color.srgb },
    output: { space: "xyz-d65", coords: [...xyzColor.coords] },
    reference: { space: "xyz-d65", coords: [...xyzColor.coords] },
    inGamut: true,
    css: {
      input: `color(srgb ${color.srgb.join(" ")})`,
      output: `color(xyz-d65 ${xyzColor.coords.map((c) => c.toFixed(6)).join(" ")})`,
    },
    notes: "Boundary condition test",
  });
}

// ============================================
// GENERATE HTML
// ============================================

function generateHTML(): string {
  const categories = [...new Set(testCases.map((t) => t.category))];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Advanced Color Science Tests</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      color: #e0e0e0;
      padding: 2rem;
      min-height: 100vh;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle { color: #888; margin-bottom: 2rem; }
    
    .category {
      margin-bottom: 2rem;
      background: rgba(255,255,255,0.03);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .category h2 {
      font-size: 1.2rem;
      color: #4ade80;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .tests {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }
    
    .test-card {
      background: rgba(0,0,0,0.3);
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .test-card.out-of-gamut {
      border-color: #ef4444;
      background: rgba(239,68,68,0.1);
    }
    .test-card h3 {
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }
    .test-card .desc {
      font-size: 0.75rem;
      color: #888;
      margin-bottom: 0.75rem;
    }
    
    .swatches {
      display: flex;
      gap: 4px;
      margin-bottom: 0.75rem;
      height: 50px;
      border-radius: 8px;
      overflow: hidden;
    }
    .swatch {
      flex: 1;
      display: flex;
      align-items: flex-end;
      padding: 4px;
      position: relative;
    }
    .swatch-label {
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      text-shadow: 0 1px 3px rgba(0,0,0,0.9);
      color: white;
    }
    .swatch.unavailable {
      background: repeating-linear-gradient(45deg, #222, #222 5px, #333 5px, #333 10px);
    }
    
    .coords {
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 0.7rem;
      color: #aaa;
      margin-bottom: 0.5rem;
    }
    .coords .label { color: #666; }
    
    .notes {
      font-size: 0.75rem;
      padding: 0.5rem;
      background: rgba(255,255,255,0.05);
      border-radius: 4px;
      color: #888;
    }
    .notes.warning { color: #fbbf24; background: rgba(251,191,36,0.1); }
    .notes.success { color: #4ade80; background: rgba(74,222,128,0.1); }
    .notes.error { color: #ef4444; background: rgba(239,68,68,0.1); }
    
    footer {
      margin-top: 3rem;
      text-align: center;
      color: #666;
      padding: 2rem;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
  </style>
</head>
<body>
  <h1>🔬 Advanced Color Science Tests</h1>
  <p class="subtitle">Edge cases, gamut mapping, round-trips • ColorJS Reference • Generated ${new Date().toLocaleString()}</p>
  
  ${categories
    .map(
      (category) => `
    <div class="category">
      <h2>${category}</h2>
      <div class="tests">
        ${testCases
          .filter((t) => t.category === category)
          .map((test) => {
            const noteClass = test.notes.includes("✅")
              ? "success"
              : test.notes.includes("⚠️") || test.notes.includes("Out of gamut")
                ? "warning"
                : "";
            return `
          <div class="test-card ${!test.inGamut ? "out-of-gamut" : ""}">
            <h3>${test.name}</h3>
            <div class="desc">${test.description}</div>
            <div class="swatches">
              ${
                test.css.input
                  ? `<div class="swatch" style="background: ${test.css.input}"><span class="swatch-label">Input</span></div>`
                  : `<div class="swatch unavailable"><span class="swatch-label">N/A</span></div>`
              }
              ${
                test.css.output
                  ? `<div class="swatch" style="background: ${test.css.output}"><span class="swatch-label">Output</span></div>`
                  : `<div class="swatch unavailable"><span class="swatch-label">OOG</span></div>`
              }
            </div>
            <div class="coords">
              <span class="label">${test.input.space}:</span> [${test.input.coords.map((c) => (isNaN(c) ? "NaN" : c.toFixed(4))).join(", ")}]<br>
              <span class="label">${test.output.space}:</span> [${test.output.coords.map((c) => (isNaN(c) ? "NaN" : c.toFixed(4))).join(", ")}]
            </div>
            <div class="notes ${noteClass}">${test.notes}</div>
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
    <p>TokenScript Color Schema Registry • Advanced Color Science Testing</p>
    <p>Reference values from ColorJS</p>
  </footer>
</body>
</html>`;
}

// Generate and save
const html = generateHTML();
const outputPath = path.join(__dirname, "..", "demo", "advanced-tests.html");
fs.writeFileSync(outputPath, html);

console.log(`✅ Advanced demo generated: ${outputPath}`);
console.log(`   Open: file://${outputPath}`);
console.log(`\nTest categories:`);
const categories = [...new Set(testCases.map((t) => t.category))];
for (const cat of categories) {
  const count = testCases.filter((t) => t.category === cat).length;
  console.log(`   • ${cat}: ${count} tests`);
}

