/**
 * Comprehensive Color Space Conversion Benchmark
 *
 * Tests ALL color space conversions in BOTH directions with proper
 * statistical benchmarking. Generates a markdown report.
 *
 * Usage: npx tsx scripts/benchmark-all-conversions.ts
 */

import { Interpreter, Lexer, Parser, type Config } from "@tokens-studio/tokenscript-interpreter";
import { setupColorManagerWithSchemas } from "@tests/helpers/schema-test-utils";
import * as fs from "fs";

// ════════════════════════════════════════════════════════════════════════════
// Configuration
// ════════════════════════════════════════════════════════════════════════════

const WARMUP_ITERATIONS = 10;
const BENCHMARK_ITERATIONS = 100; // More iterations for statistical accuracy
const CONFIDENCE_RUNS = 3; // Run each benchmark multiple times for confidence

// Color spaces and their TokenScript type names / conversion method names
const COLOR_SPACES: Record<string, { type: string; method: string; sample: string }> = {
  srgb: { type: "SRGB", method: "srgb", sample: "c.r = 0.5; c.g = 0.3; c.b = 0.8;" },
  hsl: { type: "HSL", method: "hsl", sample: "c.h = 270; c.s = 0.6; c.l = 0.55;" },
  hsv: { type: "HSV", method: "hsv", sample: "c.h = 270; c.s = 0.6; c.v = 0.8;" },
  hwb: { type: "HWB", method: "hwb", sample: "c.h = 270; c.w = 0.2; c.b = 0.2;" },
  rgb: { type: "RGB", method: "rgb", sample: "c.r = 128; c.g = 77; c.b = 204;" },
  hex: { type: "Hex", method: "hex", sample: 'c.value = "#804DCC";' },
  oklch: { type: "OKLCH", method: "oklch", sample: "c.l = 0.55; c.c = 0.15; c.h = 300;" },
  oklab: { type: "OKLab", method: "oklab", sample: "c.l = 0.55; c.a = 0.1; c.b = -0.1;" },
  okhsl: { type: "OKHSL", method: "okhsl", sample: "c.h = 270; c.s = 0.7; c.l = 0.55;" },
  okhsv: { type: "OKHSV", method: "okhsv", sample: "c.h = 270; c.s = 0.7; c.v = 0.8;" },
  xyzd65: { type: "XYZD65", method: "xyzd65", sample: "c.x = 0.2; c.y = 0.15; c.z = 0.5;" },
  xyzd50: { type: "XYZD50", method: "xyzd50", sample: "c.x = 0.2; c.y = 0.15; c.z = 0.4;" },
  lab: { type: "Lab", method: "lab", sample: "c.l = 50; c.a = 30; c.b = -40;" },
  lch: { type: "LCH", method: "lch", sample: "c.l = 50; c.c = 50; c.h = 300;" },
  p3: { type: "P3", method: "p3", sample: "c.r = 0.5; c.g = 0.3; c.b = 0.8;" },
  linear: { type: "SRGBLinear", method: "linear", sample: "c.r = 0.2; c.g = 0.07; c.b = 0.6;" },
};

interface BenchmarkResult {
  from: string;
  to: string;
  avgMs: number;
  avgUs: number;
  stdDev: number;
  minMs: number;
  maxMs: number;
  opsPerSec: number;
  iterations: number;
  success: boolean;
  error?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Benchmark Functions
// ════════════════════════════════════════════════════════════════════════════

function runSingleBenchmark(code: string, config: Config, iterations: number): number[] {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const lexer = new Lexer(code);
    const parser = new Parser(lexer);
    const interpreter = new Interpreter(parser, { config });
    interpreter.interpret();
    const end = performance.now();
    times.push(end - start);
  }

  return times;
}

function calculateStats(times: number[]): { avg: number; stdDev: number; min: number; max: number } {
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...times);
  const max = Math.max(...times);
  return { avg, stdDev, min, max };
}

async function benchmarkConversion(
  from: string,
  to: string,
  config: Config
): Promise<BenchmarkResult> {
  const fromSpace = COLOR_SPACES[from];
  const toSpace = COLOR_SPACES[to];

  if (!fromSpace || !toSpace) {
    return {
      from,
      to,
      avgMs: 0,
      avgUs: 0,
      stdDev: 0,
      minMs: 0,
      maxMs: 0,
      opsPerSec: 0,
      iterations: 0,
      success: false,
      error: "Unknown color space",
    };
  }

  const code = `
    variable c: Color.${fromSpace.type};
    ${fromSpace.sample}
    c.to.${toSpace.method}()
  `;

  try {
    // Warmup
    runSingleBenchmark(code, config, WARMUP_ITERATIONS);

    // Multiple confidence runs
    const allTimes: number[] = [];
    for (let run = 0; run < CONFIDENCE_RUNS; run++) {
      const times = runSingleBenchmark(code, config, BENCHMARK_ITERATIONS);
      allTimes.push(...times);
    }

    const stats = calculateStats(allTimes);

    return {
      from,
      to,
      avgMs: stats.avg,
      avgUs: stats.avg * 1000,
      stdDev: stats.stdDev,
      minMs: stats.min,
      maxMs: stats.max,
      opsPerSec: 1000 / stats.avg,
      iterations: allTimes.length,
      success: true,
    };
  } catch (error) {
    return {
      from,
      to,
      avgMs: 0,
      avgUs: 0,
      stdDev: 0,
      minMs: 0,
      maxMs: 0,
      opsPerSec: 0,
      iterations: 0,
      success: false,
      error: String(error).substring(0, 100),
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Report Generation
// ════════════════════════════════════════════════════════════════════════════

function generateMarkdownReport(results: BenchmarkResult[], startTime: Date): string {
  const endTime = new Date();
  const duration = (endTime.getTime() - startTime.getTime()) / 1000;

  // Group by source color space
  const bySource: Record<string, BenchmarkResult[]> = {};
  results.forEach((r) => {
    if (!bySource[r.from]) bySource[r.from] = [];
    bySource[r.from].push(r);
  });

  // Find successful results for analysis
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  // Sort by speed
  const sortedBySpeed = [...successful].sort((a, b) => a.avgMs - b.avgMs);
  const fastest = sortedBySpeed.slice(0, 10);
  const slowest = sortedBySpeed.slice(-10).reverse();

  // Calculate baseline (sRGB → HSL as reference)
  const baseline = successful.find((r) => r.from === "srgb" && r.to === "hsl");
  const baselineMs = baseline?.avgMs || 0.1;

  let report = `# Color Space Conversion Performance Benchmark

> Generated: ${endTime.toISOString()}
> Duration: ${duration.toFixed(1)}s
> Iterations per test: ${BENCHMARK_ITERATIONS * CONFIDENCE_RUNS}
> Node.js: ${process.version}
> Platform: ${process.platform} ${process.arch}

## Executive Summary

| Metric | Value |
|--------|-------|
| Total conversions tested | ${results.length} |
| Successful | ${successful.length} |
| Failed | ${failed.length} |
| Fastest conversion | ${sortedBySpeed[0]?.from} → ${sortedBySpeed[0]?.to} (${sortedBySpeed[0]?.avgUs.toFixed(0)} µs) |
| Slowest conversion | ${sortedBySpeed[sortedBySpeed.length - 1]?.from} → ${sortedBySpeed[sortedBySpeed.length - 1]?.to} (${sortedBySpeed[sortedBySpeed.length - 1]?.avgUs.toFixed(0)} µs) |

## Top 10 Fastest Conversions

| Rank | From | To | Avg (µs) | Std Dev | Ops/sec |
|------|------|-----|----------|---------|---------|
`;

  fastest.forEach((r, i) => {
    report += `| ${i + 1} | ${r.from} | ${r.to} | ${r.avgUs.toFixed(0)} | ±${(r.stdDev * 1000).toFixed(1)} | ${r.opsPerSec.toFixed(0)} |\n`;
  });

  report += `
## Top 10 Slowest Conversions

| Rank | From | To | Avg (µs) | Std Dev | Ops/sec | vs Baseline |
|------|------|-----|----------|---------|---------|-------------|
`;

  slowest.forEach((r, i) => {
    const vsBaseline = (r.avgMs / baselineMs).toFixed(1);
    report += `| ${i + 1} | ${r.from} | ${r.to} | ${r.avgUs.toFixed(0)} | ±${(r.stdDev * 1000).toFixed(1)} | ${r.opsPerSec.toFixed(0)} | ${vsBaseline}x |\n`;
  });

  // OKHSL/OKHSV specific section
  const okConversions = successful.filter(
    (r) => r.from.startsWith("ok") || r.to.startsWith("ok")
  );
  if (okConversions.length > 0) {
    report += `
## OK* Color Space Performance (OKHSL, OKHSV, OKLab, OKLCH)

These color spaces use the Björn Ottosson algorithms. OKHSL/OKHSV include
the full \`findGamutIntersection\` with Halley's method refinement.

| From | To | Avg (µs) | Std Dev | Ops/sec | vs Baseline |
|------|-----|----------|---------|---------|-------------|
`;

    okConversions
      .sort((a, b) => a.avgMs - b.avgMs)
      .forEach((r) => {
        const vsBaseline = (r.avgMs / baselineMs).toFixed(1);
        report += `| ${r.from} | ${r.to} | ${r.avgUs.toFixed(0)} | ±${(r.stdDev * 1000).toFixed(1)} | ${r.opsPerSec.toFixed(0)} | ${vsBaseline}x |\n`;
      });
  }

  // Bidirectional comparison
  report += `
## Bidirectional Comparison (A→B vs B→A)

Comparing forward vs reverse conversion costs.

| Conversion | Forward (µs) | Reverse (µs) | Ratio | Notes |
|------------|--------------|--------------|-------|-------|
`;

  const pairs = new Set<string>();
  successful.forEach((r) => {
    const key = [r.from, r.to].sort().join("-");
    pairs.add(key);
  });

  pairs.forEach((pair) => {
    const [a, b] = pair.split("-");
    const forward = successful.find((r) => r.from === a && r.to === b);
    const reverse = successful.find((r) => r.from === b && r.to === a);

    if (forward && reverse) {
      const ratio = (forward.avgMs / reverse.avgMs).toFixed(2);
      const diff = Math.abs(forward.avgMs - reverse.avgMs);
      const note =
        diff < 0.01 ? "≈ Equal" : forward.avgMs > reverse.avgMs ? `${a}→${b} slower` : `${b}→${a} slower`;
      report += `| ${a} ↔ ${b} | ${forward.avgUs.toFixed(0)} | ${reverse.avgUs.toFixed(0)} | ${ratio} | ${note} |\n`;
    }
  });

  // Full matrix
  report += `
## Complete Conversion Matrix

All tested conversions sorted by source color space.

`;

  const spaces = Object.keys(COLOR_SPACES);
  spaces.forEach((source) => {
    const conversions = successful.filter((r) => r.from === source);
    if (conversions.length === 0) return;

    report += `### From ${source.toUpperCase()}\n\n`;
    report += `| To | Avg (µs) | Std Dev | Min | Max | Ops/sec |\n`;
    report += `|----|----------|---------|-----|-----|--------|\n`;

    conversions
      .sort((a, b) => a.avgMs - b.avgMs)
      .forEach((r) => {
        report += `| ${r.to} | ${r.avgUs.toFixed(0)} | ±${(r.stdDev * 1000).toFixed(1)} | ${(r.minMs * 1000).toFixed(0)} | ${(r.maxMs * 1000).toFixed(0)} | ${r.opsPerSec.toFixed(0)} |\n`;
      });

    report += "\n";
  });

  // Failed conversions
  if (failed.length > 0) {
    report += `## Failed Conversions

| From | To | Error |
|------|-----|-------|
`;
    failed.forEach((r) => {
      report += `| ${r.from} | ${r.to} | ${r.error} |\n`;
    });
  }

  // Pipeline recommendations
  report += `
## Pipeline Performance Guidelines

### Processing 10,000 colors

| Conversion Type | Estimated Time |
|-----------------|---------------|
`;

  const categories = [
    { name: "Simple (HSL, HSV, HWB)", filter: (r: BenchmarkResult) => ["hsl", "hsv", "hwb"].includes(r.to) && r.from === "srgb" },
    { name: "Medium (OKLCH, Lab, XYZ)", filter: (r: BenchmarkResult) => ["oklch", "oklab", "lab", "xyzd65"].includes(r.to) && r.from === "srgb" },
    { name: "Complex (OKHSL, OKHSV)", filter: (r: BenchmarkResult) => ["okhsl", "okhsv"].includes(r.to) && r.from === "srgb" },
  ];

  categories.forEach((cat) => {
    const matches = successful.filter(cat.filter);
    if (matches.length > 0) {
      const avgMs = matches.reduce((sum, r) => sum + r.avgMs, 0) / matches.length;
      report += `| ${cat.name} | ${((avgMs * 10000) / 1000).toFixed(2)}s |\n`;
    }
  });

  report += `
### Recommendations

1. **For real-time UI**: Use simpler conversions (HSL, OKLCH) - ~50-200µs each
2. **For batch processing**: OKHSL/OKHSV are ~300-400µs each - consider caching
3. **For design tools**: Pre-compute color scales at build time
4. **For animation**: Interpolate in OKLCH (faster than OKHSL with similar perceptual quality)

---
*Benchmark generated by TokenScript Schema Registry*
`;

  return report;
}

// ════════════════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  const startTime = new Date();

  console.log("\n" + "═".repeat(70));
  console.log("  COMPREHENSIVE COLOR CONVERSION BENCHMARK");
  console.log("═".repeat(70));
  console.log(`\n  Iterations: ${BENCHMARK_ITERATIONS * CONFIDENCE_RUNS} per conversion`);
  console.log(`  Color spaces: ${Object.keys(COLOR_SPACES).length}`);
  console.log(`  Testing all permutations...\n`);

  // Setup config with all color spaces
  console.log("  Loading color space schemas...");
  const config = await setupColorManagerWithSchemas([
    "srgb-color",
    "srgb-linear-color",
    "xyz-d65-color",
    "xyz-d50-color",
    "oklab-color",
    "oklch-color",
    "hsl-color",
    "hsv-color",
    "hwb-color",
    "okhsl-color",
    "okhsv-color",
    "lab-color",
    "lch-color",
    "rgb-color",
    "hex-color",
    "p3-color",
    "p3-linear-color",
  ]);

  const results: BenchmarkResult[] = [];
  const spaces = Object.keys(COLOR_SPACES);
  const totalTests = spaces.length * (spaces.length - 1);
  let completed = 0;

  // Test all permutations
  for (const from of spaces) {
    for (const to of spaces) {
      if (from === to) continue;

      completed++;
      process.stdout.write(`\r  Progress: ${completed}/${totalTests} (${from} → ${to})`.padEnd(60));

      const result = await benchmarkConversion(from, to, config);
      results.push(result);
    }
  }

  console.log("\n\n  Generating report...\n");

  // Generate markdown report
  const report = generateMarkdownReport(results, startTime);

  // Save to file
  const reportPath = "benchmark-report.md";
  fs.writeFileSync(reportPath, report);
  console.log(`  ✅ Report saved to: ${reportPath}`);

  // Print summary to console
  const successful = results.filter((r) => r.success);
  const sortedBySpeed = [...successful].sort((a, b) => a.avgMs - b.avgMs);

  console.log("\n" + "─".repeat(70));
  console.log("  QUICK SUMMARY\n");

  console.log("  🏆 Top 5 Fastest:");
  sortedBySpeed.slice(0, 5).forEach((r, i) => {
    console.log(`     ${i + 1}. ${r.from} → ${r.to}: ${r.avgUs.toFixed(0)} µs`);
  });

  console.log("\n  🐢 Top 5 Slowest:");
  sortedBySpeed.slice(-5).reverse().forEach((r, i) => {
    console.log(`     ${i + 1}. ${r.from} → ${r.to}: ${r.avgUs.toFixed(0)} µs`);
  });

  // OK* specific
  const okhslToSrgb = successful.find((r) => r.from === "okhsl" && r.to === "srgb");
  const srgbToOkhsl = successful.find((r) => r.from === "srgb" && r.to === "okhsl");
  const oklchToSrgb = successful.find((r) => r.from === "oklch" && r.to === "srgb");

  if (srgbToOkhsl && oklchToSrgb) {
    console.log("\n  📊 OKHSL Performance:");
    console.log(`     sRGB → OKHSL: ${srgbToOkhsl.avgUs.toFixed(0)} µs (${srgbToOkhsl.opsPerSec.toFixed(0)} ops/sec)`);
    console.log(`     OKHSL → sRGB: ${okhslToSrgb?.avgUs.toFixed(0)} µs (${okhslToSrgb?.opsPerSec.toFixed(0)} ops/sec)`);
    console.log(`     vs OKLCH: ${(srgbToOkhsl.avgMs / oklchToSrgb.avgMs).toFixed(1)}x slower`);
  }

  console.log("\n" + "═".repeat(70) + "\n");
}

main().catch(console.error);

