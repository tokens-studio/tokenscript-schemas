/**
 * Benchmark: Color Space Conversion Performance
 *
 * Measures execution time for various color conversions to understand
 * the cost of complex algorithms like OKHSL/OKHSV vs simpler ones.
 */

import { setupColorManagerWithSchemas } from "@tests/helpers/schema-test-utils";
import { type Config, Interpreter, Lexer, Parser } from "@tokens-studio/tokenscript-interpreter";

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalMs: number;
  avgMs: number;
  avgUs: number;
  opsPerSec: number;
}

async function benchmark(
  name: string,
  code: string,
  config: Config,
  iterations: number = 100,
): Promise<BenchmarkResult> {
  // Warm-up run
  const lexer = new Lexer(code);
  const parser = new Parser(lexer);
  const warmup = new Interpreter(parser, { config });
  warmup.interpret();

  // Benchmark runs
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    const lexer = new Lexer(code);
    const parser = new Parser(lexer);
    const interpreter = new Interpreter(parser, { config });
    interpreter.interpret();
  }

  const end = performance.now();
  const totalMs = end - start;
  const avgMs = totalMs / iterations;
  const avgUs = avgMs * 1000;
  const opsPerSec = 1000 / avgMs;

  return { name, iterations, totalMs, avgMs, avgUs, opsPerSec };
}

async function runBenchmarks() {
  console.log(`\n${"═".repeat(70)}`);
  console.log("  COLOR CONVERSION PERFORMANCE BENCHMARK");
  console.log(`${"═".repeat(70)}\n`);

  // Setup config with all needed schemas
  const config = await setupColorManagerWithSchemas([
    "srgb-color",
    "srgb-linear-color",
    "xyz-d65-color",
    "oklab-color",
    "oklch-color",
    "hsl-color",
    "okhsl-color",
    "okhsv-color",
  ]);

  const iterations = 50; // Reduced for reasonable runtime

  const benchmarks: { category: string; tests: Array<{ name: string; code: string }> }[] = [
    {
      category: "Simple Conversions (1 step)",
      tests: [
        {
          name: "sRGB → HSL",
          code: `
            variable c: Color.SRGB;
            c.r = 0.5; c.g = 0.3; c.b = 0.8;
            c.to.hsl()
          `,
        },
      ],
    },
    {
      category: "Medium Conversions (2-3 steps)",
      tests: [
        {
          name: "sRGB → XYZ-D65",
          code: `
            variable c: Color.SRGB;
            c.r = 0.5; c.g = 0.3; c.b = 0.8;
            c.to.xyzd65()
          `,
        },
        {
          name: "sRGB → OKLab",
          code: `
            variable c: Color.SRGB;
            c.r = 0.5; c.g = 0.3; c.b = 0.8;
            c.to.oklab()
          `,
        },
        {
          name: "sRGB → OKLCH",
          code: `
            variable c: Color.SRGB;
            c.r = 0.5; c.g = 0.3; c.b = 0.8;
            c.to.oklch()
          `,
        },
      ],
    },
    {
      category: "Complex Conversions (OKHSL/OKHSV with gamut intersection)",
      tests: [
        {
          name: "sRGB → OKHSL (full algorithm)",
          code: `
            variable c: Color.SRGB;
            c.r = 0.5; c.g = 0.3; c.b = 0.8;
            c.to.okhsl()
          `,
        },
        {
          name: "sRGB → OKHSV (full algorithm)",
          code: `
            variable c: Color.SRGB;
            c.r = 0.5; c.g = 0.3; c.b = 0.8;
            c.to.okhsv()
          `,
        },
      ],
    },
    {
      category: "Round-trip Conversions",
      tests: [
        {
          name: "sRGB → OKLCH → sRGB",
          code: `
            variable c: Color.SRGB;
            c.r = 0.5; c.g = 0.3; c.b = 0.8;
            c.to.oklch().to.srgb()
          `,
        },
        {
          name: "sRGB → OKHSL → sRGB",
          code: `
            variable c: Color.SRGB;
            c.r = 0.5; c.g = 0.3; c.b = 0.8;
            c.to.okhsl().to.srgb()
          `,
        },
      ],
    },
  ];

  const results: BenchmarkResult[] = [];

  for (const category of benchmarks) {
    console.log(`\n📊 ${category.category}\n${"─".repeat(50)}`);

    for (const test of category.tests) {
      try {
        const result = await benchmark(test.name, test.code, config, iterations);
        results.push(result);

        console.log(`  ${test.name}`);
        console.log(`    ├─ Avg: ${result.avgMs.toFixed(3)} ms (${result.avgUs.toFixed(0)} µs)`);
        console.log(`    └─ Throughput: ${result.opsPerSec.toFixed(0)} ops/sec\n`);
      } catch (error) {
        console.log(`  ${test.name}: ERROR - ${error}`);
      }
    }
  }

  // Summary comparison
  console.log(`\n${"═".repeat(70)}`);
  console.log("  PERFORMANCE COMPARISON SUMMARY");
  console.log(`${"═".repeat(70)}\n`);

  // Find baseline (simplest conversion) - use HSL as baseline
  const baseline = results.find((r) => r.name.includes("HSL") && !r.name.includes("OK"));
  const okhsl = results.find((r) => r.name.includes("OKHSL") && !r.name.includes("Round"));
  const okhsv = results.find((r) => r.name.includes("OKHSV") && !r.name.includes("Round"));
  const oklch = results.find((r) => r.name.includes("OKLCH") && !r.name.includes("Round"));

  if (baseline && okhsl && oklch) {
    console.log("Relative cost (compared to sRGB → HSL baseline):\n");

    results.forEach((r) => {
      const relative = r.avgMs / baseline.avgMs;
      const bar = "█".repeat(Math.min(50, Math.round(relative * 2)));
      console.log(`  ${r.name.padEnd(45)} ${relative.toFixed(1)}x  ${bar}`);
    });
  }

  // Pipeline simulation
  console.log(`\n${"─".repeat(70)}`);
  console.log("  PIPELINE SIMULATION (processing 10,000 colors)\n");

  if (okhsl && okhsv && oklch && baseline) {
    const colors = 10000;
    console.log(
      `  sRGB → HSL (baseline): ${((baseline.avgMs * colors) / 1000).toFixed(2)}s (${(baseline.avgMs * colors).toFixed(0)} ms)`,
    );
    console.log(
      `  sRGB → OKLCH:          ${((oklch.avgMs * colors) / 1000).toFixed(2)}s (${(oklch.avgMs * colors).toFixed(0)} ms)`,
    );
    console.log(
      `  sRGB → OKHSL:          ${((okhsl.avgMs * colors) / 1000).toFixed(2)}s (${(okhsl.avgMs * colors).toFixed(0)} ms)`,
    );
    console.log(
      `  sRGB → OKHSV:          ${((okhsv.avgMs * colors) / 1000).toFixed(2)}s (${(okhsv.avgMs * colors).toFixed(0)} ms)`,
    );

    console.log(`\n  📈 OKHSL is ${(okhsl.avgMs / oklch.avgMs).toFixed(1)}x slower than OKLCH`);
    console.log(`  📈 OKHSL is ${(okhsl.avgMs / baseline.avgMs).toFixed(1)}x slower than HSL`);
    console.log(`  📈 OKHSV is ${(okhsv.avgMs / oklch.avgMs).toFixed(1)}x slower than OKLCH`);
  }

  console.log(`\n${"═".repeat(70)}\n`);
}

runBenchmarks().catch(console.error);
