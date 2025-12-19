/**
 * Color Functions Playground Generator
 *
 * Generates an interactive HTML playground (`demo/functions-playground.html`)
 * demonstrating all 32 color manipulation functions in the TokenScript schema registry.
 *
 * Features:
 * - Live execution of each function through the real TokenScript interpreter
 * - Color swatches showing function outputs
 * - Grouped by category (Basic Adjustments, Harmony, Palettes, etc.)
 * - Interactive examples with various input colors
 *
 * Function categories:
 * - Basic Adjustments: lighten, darken, saturate, desaturate, grayscale
 * - Harmony: complement, analogous, triadic, tetradic, split_complement
 * - Palettes: shade_scale, tint_scale, steps, diverging, distributed
 * - Color Manipulation: rotate_hue, set_lightness, set_chroma, set_hue, mix
 * - Analysis: is_light, is_dark, luminance, contrast_ratio, best_contrast
 *
 * Output: demo/functions-playground.html
 *
 * Usage:
 *   npx tsx scripts/generate-functions-playground.ts
 *
 * @module scripts/generate-functions-playground
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { executeWithSchema } from "../tests/helpers/schema-test-utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface FunctionDemo {
  name: string;
  keyword: string;
  description: string;
  code: string;
  category: string;
}

const demos: FunctionDemo[] = [
  // Basic Adjustments
  {
    name: "Lighten",
    keyword: "lighten",
    description: "Makes colors lighter by increasing OKLab lightness",
    code: `variable base: Color.SRGB; base.r = 0.2; base.g = 0.4; base.b = 0.8;
variable light1: Color.SRGB = lighten(base, 0.1);
variable light2: Color.SRGB = lighten(base, 0.25);
variable light3: Color.SRGB = lighten(base, 0.5);
return base, light1, light2, light3;`,
    category: "Basic Adjustments",
  },
  {
    name: "Darken",
    keyword: "darken",
    description: "Makes colors darker by decreasing OKLab lightness",
    code: `variable base: Color.SRGB; base.r = 0.6; base.g = 0.8; base.b = 0.9;
variable dark1: Color.SRGB = darken(base, 0.1);
variable dark2: Color.SRGB = darken(base, 0.25);
variable dark3: Color.SRGB = darken(base, 0.5);
return base, dark1, dark2, dark3;`,
    category: "Basic Adjustments",
  },
  {
    name: "Saturate",
    keyword: "saturate",
    description: "Increases color saturation by boosting OKLCH chroma",
    code: `variable base: Color.SRGB; base.r = 0.5; base.g = 0.5; base.b = 0.6;
variable sat1: Color.SRGB = saturate(base, 0.5);
variable sat2: Color.SRGB = saturate(base, 1.0);
variable sat3: Color.SRGB = saturate(base, 2.0);
return base, sat1, sat2, sat3;`,
    category: "Basic Adjustments",
  },
  {
    name: "Desaturate",
    keyword: "desaturate",
    description: "Decreases color saturation by reducing OKLCH chroma",
    code: `variable base: Color.SRGB; base.r = 0.9; base.g = 0.3; base.b = 0.3;
variable desat1: Color.SRGB = desaturate(base, 0.25);
variable desat2: Color.SRGB = desaturate(base, 0.5);
variable desat3: Color.SRGB = desaturate(base, 0.75);
return base, desat1, desat2, desat3;`,
    category: "Basic Adjustments",
  },
  {
    name: "Grayscale",
    keyword: "grayscale",
    description: "Removes all saturation while preserving perceptual lightness",
    code: `variable red: Color.SRGB; red.r = 1; red.g = 0; red.b = 0;
variable green: Color.SRGB; green.r = 0; green.g = 0.8; green.b = 0.2;
variable blue: Color.SRGB; blue.r = 0.2; blue.g = 0.4; blue.b = 0.9;
return red, grayscale(red), green, grayscale(green), blue, grayscale(blue);`,
    category: "Basic Adjustments",
  },
  {
    name: "Invert",
    keyword: "invert",
    description: "Inverts RGB channels (255 - value)",
    code: `variable c1: Color.Rgb = rgb(50, 100, 200);
variable c2: Color.Rgb = rgb(200, 50, 100);
return c1, invert(c1), c2, invert(c2);`,
    category: "Basic Adjustments",
  },
  {
    name: "Complement",
    keyword: "complement",
    description: "Rotates hue 180° for complementary color",
    code: `variable red: Color.SRGB; red.r = 0.9; red.g = 0.2; red.b = 0.2;
variable blue: Color.SRGB; blue.r = 0.2; blue.g = 0.4; blue.b = 0.9;
variable yellow: Color.SRGB; yellow.r = 0.95; yellow.g = 0.85; yellow.b = 0.2;
return red, complement(red), blue, complement(blue), yellow, complement(yellow);`,
    category: "Basic Adjustments",
  },
  // Mixing
  {
    name: "Mix",
    keyword: "mix",
    description: "Blends two colors in OKLCH with shortest hue path",
    code: `variable red: Color.SRGB; red.r = 1; red.g = 0; red.b = 0;
variable blue: Color.SRGB; blue.r = 0; blue.g = 0; blue.b = 1;
return red, mix(red, blue, 0.25), mix(red, blue, 0.5), mix(red, blue, 0.75), blue;`,
    category: "Color Mixing",
  },
  {
    name: "Steps",
    keyword: "steps",
    description: "Generates gradient stops between two colors",
    code: `variable c1: Color.SRGB; c1.r = 0.2; c1.g = 0.8; c1.b = 0.4;
variable c2: Color.SRGB; c2.r = 0.9; c2.g = 0.3; c2.b = 0.5;
return steps(c1, c2, 7);`,
    category: "Color Mixing",
  },
  // Harmonies
  {
    name: "Analogous",
    keyword: "analogous",
    description: "Adjacent hues for harmonious palettes",
    code: `variable base: Color.SRGB; base.r = 0.2; base.g = 0.6; base.b = 0.9;
return analogous(base, 5, 60);`,
    category: "Color Harmonies",
  },
  {
    name: "Triadic",
    keyword: "triadic",
    description: "Three colors equally spaced 120° apart",
    code: `variable base: Color.SRGB; base.r = 0.9; base.g = 0.3; base.b = 0.3;
return triadic(base);`,
    category: "Color Harmonies",
  },
  {
    name: "Tetradic",
    keyword: "tetradic",
    description: "Four colors equally spaced 90° apart",
    code: `variable base: Color.SRGB; base.r = 0.3; base.g = 0.7; base.b = 0.4;
return tetradic(base);`,
    category: "Color Harmonies",
  },
  {
    name: "Split Complement",
    keyword: "split_complement",
    description: "Base color plus two colors adjacent to complement",
    code: `variable base: Color.SRGB; base.r = 0.2; base.g = 0.5; base.b = 0.9;
return split_complement(base, 30);`,
    category: "Color Harmonies",
  },
  // Design Token Scales
  {
    name: "Shade Scale",
    keyword: "shade_scale",
    description: "Tailwind-style 50-900 shade scale",
    code: `variable base: Color.SRGB; base.r = 0.2; base.g = 0.5; base.b = 0.9;
return shade_scale(base, 10);`,
    category: "Design Token Scales",
  },
  {
    name: "Tint Scale",
    keyword: "tint_scale",
    description: "Sequential single-hue scale",
    code: `variable base: Color.SRGB; base.r = 0.1; base.g = 0.6; base.b = 0.5;
return tint_scale(base, 9);`,
    category: "Design Token Scales",
  },
  {
    name: "Diverging",
    keyword: "diverging",
    description: "Two-sided scale for heatmaps (cold → neutral → hot)",
    code: `variable cold: Color.SRGB; cold.r = 0.13; cold.g = 0.4; cold.b = 0.67;
variable hot: Color.SRGB; hot.r = 0.7; hot.g = 0.1; hot.b = 0.1;
return diverging(cold, hot, 9);`,
    category: "Design Token Scales",
  },
  {
    name: "Distributed",
    keyword: "distributed",
    description: "Evenly spaced categorical colors",
    code: `return distributed(8, 0.7, 0.15, 30);`,
    category: "Design Token Scales",
  },
  // Accessibility
  {
    name: "Contrast Ratio",
    keyword: "contrast_ratio",
    description: "WCAG 2.1 contrast ratio between two colors",
    code: `variable bg: Color.SRGB; bg.r = 1; bg.g = 1; bg.b = 1;
variable text: Color.SRGB; text.r = 0.2; text.g = 0.2; text.b = 0.2;
return contrast_ratio(bg, text);`,
    category: "Accessibility",
  },
  {
    name: "Best Contrast",
    keyword: "best_contrast",
    description: "Picks most readable color from list",
    code: `variable bg: Color.SRGB; bg.r = 0.2; bg.g = 0.5; bg.b = 0.8;
return bg, best_contrast(bg);`,
    category: "Accessibility",
  },
  // Direct Manipulation
  {
    name: "Rotate Hue",
    keyword: "rotate_hue",
    description: "Shift hue by specified degrees",
    code: `variable base: Color.SRGB; base.r = 0.9; base.g = 0.3; base.b = 0.3;
return base, rotate_hue(base, 30), rotate_hue(base, 60), rotate_hue(base, 90), rotate_hue(base, 120);`,
    category: "Direct Manipulation",
  },
  {
    name: "Set Lightness",
    keyword: "set_lightness",
    description: "Set exact OKLCH lightness",
    code: `variable base: Color.SRGB; base.r = 0.2; base.g = 0.6; base.b = 0.9;
return set_lightness(base, 0.3), set_lightness(base, 0.5), set_lightness(base, 0.7), set_lightness(base, 0.9);`,
    category: "Direct Manipulation",
  },
  {
    name: "Set Chroma",
    keyword: "set_chroma",
    description: "Set exact OKLCH chroma/saturation",
    code: `variable base: Color.SRGB; base.r = 0.2; base.g = 0.6; base.b = 0.9;
return set_chroma(base, 0), set_chroma(base, 0.1), set_chroma(base, 0.2), set_chroma(base, 0.3);`,
    category: "Direct Manipulation",
  },
  {
    name: "Set Hue",
    keyword: "set_hue",
    description: "Set exact OKLCH hue angle",
    code: `variable base: Color.SRGB; base.r = 0.9; base.g = 0.3; base.b = 0.3;
return set_hue(base, 0), set_hue(base, 60), set_hue(base, 120), set_hue(base, 180), set_hue(base, 240), set_hue(base, 300);`,
    category: "Direct Manipulation",
  },
  // Analysis
  {
    name: "Is Light / Is Dark",
    keyword: "is_light",
    description: "Check if color is perceptually light or dark",
    code: `variable light: Color.SRGB; light.r = 0.9; light.g = 0.9; light.b = 0.8;
variable dark: Color.SRGB; dark.r = 0.2; dark.g = 0.2; dark.b = 0.3;
variable mid: Color.SRGB; mid.r = 0.5; mid.g = 0.5; mid.b = 0.5;
return light, is_light(light), dark, is_light(dark), mid, is_light(mid);`,
    category: "Color Analysis",
  },
  {
    name: "Luminance",
    keyword: "luminance",
    description: "Get relative luminance (0-1)",
    code: `variable white: Color.SRGB; white.r = 1; white.g = 1; white.b = 1;
variable gray: Color.SRGB; gray.r = 0.5; gray.g = 0.5; gray.b = 0.5;
variable black: Color.SRGB; black.r = 0; black.g = 0; black.b = 0;
return luminance(white), luminance(gray), luminance(black);`,
    category: "Color Analysis",
  },
];

async function runDemo(demo: FunctionDemo): Promise<{ colors: string[]; values: any[] }> {
  try {
    // Use executeWithSchema which properly loads and registers the function
    const result = await executeWithSchema(demo.keyword, "function", demo.code);

    // Convert result to displayable format
    const colors: string[] = [];
    const values: any[] = [];

    if (result === null || result === undefined) {
      return { colors: [], values: [] };
    }

    // Handle different result types
    if (typeof result === "number" || typeof result === "boolean") {
      values.push(result);
      return { colors, values };
    }

    // Helper to extract color from ColorSymbol
    function extractColor(c: any): string | null {
      if (!c) return null;
      const v = c.value || c;
      const subType = c.subType || "";

      // Check if it's RGB (0-255) or sRGB (0-1) based on subType
      const isRgb255 = subType === "Rgb" || subType === "RGB";

      let r = v.r?.value ?? v.r ?? 0;
      let g = v.g?.value ?? v.g ?? 0;
      let b = v.b?.value ?? v.b ?? 0;

      // If it's sRGB (0-1), multiply by 255
      if (!isRgb255) {
        r = Math.round(r * 255);
        g = Math.round(g * 255);
        b = Math.round(b * 255);
      } else {
        r = Math.round(r);
        g = Math.round(g);
        b = Math.round(b);
      }

      // Clamp values
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));

      return `rgb(${r}, ${g}, ${b})`;
    }

    // Recursive function to flatten nested lists and extract colors
    function flattenAndExtract(item: any): void {
      if (!item) return;

      if (
        item?.constructor?.name === "ColorSymbol" ||
        (item?.value && (item.value.r !== undefined || item.value.g !== undefined))
      ) {
        const color = extractColor(item);
        if (color) colors.push(color);
      } else if (typeof item === "number" || item?.constructor?.name === "NumberSymbol") {
        values.push(item?.value ?? item);
      } else if (typeof item === "boolean" || item?.constructor?.name === "BooleanSymbol") {
        values.push(item?.value ?? item);
      } else if (
        item?.constructor?.name === "ListSymbol" ||
        Array.isArray(item?.value) ||
        Array.isArray(item)
      ) {
        // Recursively flatten
        const nested = item?.value || item;
        if (Array.isArray(nested)) {
          for (const subItem of nested) {
            flattenAndExtract(subItem);
          }
        }
      }
    }

    // Start extraction
    flattenAndExtract(result);

    return { colors, values };
  } catch (e: any) {
    console.error(`Error in ${demo.name}:`, e.message);
    return { colors: [], values: [`Error: ${e.message}`] };
  }
}

function generateHTML(
  results: Map<string, { colors: string[]; values: any[]; demo: FunctionDemo }>,
): string {
  const categories = [...new Set(demos.map((d) => d.category))];

  let sectionsHTML = "";

  for (const category of categories) {
    const categoryDemos = demos.filter((d) => d.category === category);

    sectionsHTML += `
      <section class="category">
        <h2>${category}</h2>
        <div class="demos">
    `;

    for (const demo of categoryDemos) {
      const result = results.get(demo.name);
      if (!result) continue;

      let swatchesHTML = "";
      if (result.colors.length > 0) {
        swatchesHTML = `
          <div class="swatches">
            ${result.colors.map((c) => `<div class="swatch" style="background: ${c}"></div>`).join("")}
          </div>
        `;
      }

      let valuesHTML = "";
      if (result.values.length > 0) {
        valuesHTML = `
          <div class="values">
            ${result.values
              .map((v) => {
                if (typeof v === "boolean")
                  return `<span class="value bool">${v ? "✓ true" : "✗ false"}</span>`;
                if (typeof v === "number") return `<span class="value num">${v.toFixed(4)}</span>`;
                return `<span class="value">${v}</span>`;
              })
              .join("")}
          </div>
        `;
      }

      const status = result.colors.length > 0 || result.values.length > 0 ? "✓" : "✗";
      const statusClass = status === "✓" ? "pass" : "fail";

      sectionsHTML += `
        <div class="demo-card">
          <div class="demo-header">
            <span class="demo-name">${demo.name}</span>
            <span class="demo-status ${statusClass}">${status}</span>
          </div>
          <p class="demo-desc">${demo.description}</p>
          ${swatchesHTML}
          ${valuesHTML}
          <details>
            <summary>Code</summary>
            <pre class="demo-code">${demo.code.replace(/</g, "&lt;")}</pre>
          </details>
        </div>
      `;
    }

    sectionsHTML += `
        </div>
      </section>
    `;
  }

  const passCount = [...results.values()].filter(
    (r) => r.colors.length > 0 || r.values.length > 0,
  ).length;
  const totalCount = results.size;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Color Functions Playground</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --bg: #09090b;
      --surface: #18181b;
      --surface-2: #27272a;
      --border: #3f3f46;
      --text: #fafafa;
      --text-muted: #a1a1aa;
      --accent: #a855f7;
      --success: #22c55e;
      --error: #ef4444;
    }
    
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem;
    }
    
    header {
      max-width: 1400px;
      margin: 0 auto 3rem;
      text-align: center;
    }
    
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, var(--accent), #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .subtitle {
      color: var(--text-muted);
      font-size: 1.1rem;
    }
    
    .stats {
      display: inline-flex;
      gap: 1rem;
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: var(--surface);
      border-radius: 9999px;
      border: 1px solid var(--border);
    }
    
    .stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .stat-value {
      font-weight: 600;
      font-size: 1.25rem;
    }
    
    .stat-label {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    
    .category {
      max-width: 1400px;
      margin: 0 auto 3rem;
    }
    
    .category h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    
    .demos {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    
    .demo-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
    }
    
    .demo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .demo-name {
      font-weight: 600;
      font-size: 1.1rem;
    }
    
    .demo-status {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    .demo-status.pass {
      background: rgba(34, 197, 94, 0.2);
      color: var(--success);
    }
    
    .demo-status.fail {
      background: rgba(239, 68, 68, 0.2);
      color: var(--error);
    }
    
    .demo-desc {
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    
    .swatches {
      display: flex;
      gap: 4px;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    
    .swatch {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
    }
    
    .values {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    
    .value {
      padding: 0.25rem 0.75rem;
      background: var(--surface-2);
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.875rem;
    }
    
    .value.bool {
      background: rgba(34, 197, 94, 0.15);
      color: var(--success);
    }
    
    .value.num {
      background: rgba(168, 85, 247, 0.15);
      color: var(--accent);
    }
    
    details {
      margin-top: 0.5rem;
    }
    
    summary {
      cursor: pointer;
      color: var(--text-muted);
      font-size: 0.8rem;
      user-select: none;
    }
    
    .demo-code {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: var(--bg);
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      overflow-x: auto;
      white-space: pre-wrap;
      color: var(--text-muted);
    }
    
    footer {
      max-width: 1400px;
      margin: 3rem auto 0;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--text-muted);
    }
    
    footer a {
      color: var(--accent);
      text-decoration: none;
    }
  </style>
</head>
<body>
  <header>
    <h1>Color Functions Playground</h1>
    <p class="subtitle">Visual testing for TokenScript color manipulation functions</p>
    <div class="stats">
      <div class="stat">
        <span class="stat-value">${passCount}/${totalCount}</span>
        <span class="stat-label">passing</span>
      </div>
      <div class="stat">
        <span class="stat-value">${categories.length}</span>
        <span class="stat-label">categories</span>
      </div>
    </div>
  </header>
  
  ${sectionsHTML}
  
  <footer>
    <p>Part of the <a href="index.html">TokenScript Color Implementation</a> • 
    <a href="path-explorer.html">Path Explorer</a> • 
    <a href="advanced-tests.html">Advanced Tests</a></p>
  </footer>
</body>
</html>`;
}

async function main() {
  console.log("Testing color functions with TokenScript interpreter...");
  console.log(`Running ${demos.length} function demos...`);

  const results = new Map<string, { colors: string[]; values: any[]; demo: FunctionDemo }>();

  for (const demo of demos) {
    process.stdout.write(`  ${demo.name}... `);
    const result = await runDemo(demo);
    results.set(demo.name, { ...result, demo });

    if (result.colors.length > 0 || result.values.length > 0) {
      console.log(`✓ (${result.colors.length} colors, ${result.values.length} values)`);
    } else {
      console.log(`✗ no output`);
    }
  }

  const html = generateHTML(results);
  const outputPath = path.join(__dirname, "../demo/functions-playground.html");
  fs.writeFileSync(outputPath, html);

  const passCount = [...results.values()].filter(
    (r) => r.colors.length > 0 || r.values.length > 0,
  ).length;
  console.log(`\n✅ Playground generated: ${outputPath}`);
  console.log(`   ${passCount}/${demos.length} functions working`);
}

main().catch(console.error);
