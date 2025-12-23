/**
 * Centralized logging for tests using ulog
 * Logs are disabled by default and only shown on errors or when explicitly enabled
 */

/// <reference path="../../types/ulog.d.ts" />
import ulog from "ulog";

// ulog levels: { error: 1, warn: 2, info: 3, log: 4, debug: 5, trace: 6 }
// Using hardcoded values to avoid runtime initialization issues
const LOG_LEVELS = {
  error: 1,
  warn: 2,
  info: 3,
  log: 4,
  debug: 5,
} as const;

// Define Logger type locally to avoid TypeScript declaration errors
interface Logger {
  (...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
  log(...args: any[]): void;
  debug(...args: any[]): void;
  trace(...args: any[]): void;
  level: number;
}

/**
 * Default logger for all test operations
 * Use: log.debug(), log.info(), log.warn(), log.error()
 */
export const log: Logger = ulog("schema-registry");

// Set default log level from environment or disable by default (error = 1)
const logLevel = (process.env.LOG_LEVEL || "error") as keyof typeof LOG_LEVELS;
log.level = LOG_LEVELS[logLevel] || LOG_LEVELS.error;

/**
 * Enable verbose logging for debugging
 * Useful for troubleshooting test failures
 */
export function enableVerboseLogging() {
  log.level = LOG_LEVELS.debug;
}

/**
 * Disable all logging (except errors)
 */
export function disableLogging() {
  log.level = LOG_LEVELS.error;
}

/**
 * Set custom log level
 * @param level - "debug" | "log" | "info" | "warn" | "error"
 */
export function setLogLevel(level: keyof typeof LOG_LEVELS) {
  log.level = LOG_LEVELS[level];
}
