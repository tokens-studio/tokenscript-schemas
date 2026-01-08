#!/usr/bin/env node

/**
 * CLI entry point for @tokens-studio/tokenscript-schemas
 */

/// <reference types="../../types/ulog" />

import cac from "cac";
import anylogger from "ulog";
import { type BuildDirOptions, handleBuildCommand } from "./commands/build-dir.js";
import { type BundleOptions, handleBundleCommand } from "./commands/bundle.js";
import { handleListCommand, type ListOptions } from "./commands/list.js";
import { handlePresetsCommand } from "./commands/presets.js";

const log = anylogger("cli");

const cli = cac("tokenscript-schemas");

// Bundle command
cli
  .command("bundle [...schemas]", "Bundle schemas into a JS file")
  .option("-c, --config <path>", "Path to config file")
  .option("-o, --output <path>", "Output file path", { default: "./tokenscript-schemas.js" })
  .option("-d, --dry-run", "Preview what would be bundled without writing")
  .option("-s, --schemas-dir <path>", "Custom schema directory (overrides default)")
  .action(async (schemas: string[], options: BundleOptions) => {
    try {
      await handleBundleCommand(schemas, options);
    } catch (error) {
      log.error("Error:", error);
      process.exit(1);
    }
  });

// Build command
cli
  .command("build <directory>", "Build an individual schema directory")
  .option("-o, --output <path>", "Output file path (defaults to stdout)")
  .option("-p, --pretty", "Pretty print JSON output")
  .action(async (directory: string, options: BuildDirOptions) => {
    try {
      await handleBuildCommand(directory, options);
    } catch (error) {
      log.error("Error:", error);
      process.exit(1);
    }
  });

// List command
cli
  .command("list", "List available schemas")
  .option("--types", "List only type schemas")
  .option("--functions", "List only function schemas")
  .action(async (options: ListOptions) => {
    try {
      await handleListCommand(options);
    } catch (error) {
      log.error("Error:", error);
      process.exit(1);
    }
  });

// Presets command
cli.command("presets", "List available bundle presets").action(async () => {
  try {
    await handlePresetsCommand();
  } catch (error) {
    log.error("Error:", error);
    process.exit(1);
  }
});

cli.help();
cli.version("0.0.14");

cli.parse();
