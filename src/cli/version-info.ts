/**
 * Get version information for the bundled output
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build-time constant injected by tsup
declare const __IS_BUILT_PACKAGE__: boolean;

// Check if we're running from built package (will be true in dist, undefined when running via tsx)
const IS_BUILT = typeof __IS_BUILT_PACKAGE__ !== "undefined" && __IS_BUILT_PACKAGE__;

export interface VersionInfo {
  version: string; // Package version or git SHA
  githubUrl: string;
  isLocal: boolean; // true if running from local repo (not published package)
}

/**
 * Get the current git SHA
 */
function getGitSha(): string | null {
  try {
    return execSync("git rev-parse --short HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Get version from package.json
 */
function getPackageVersion(): string {
  try {
    // Try multiple paths for package.json
    const paths = [
      join(__dirname, "../../package.json"), // From src/cli
      join(__dirname, "../../../package.json"), // From dist/cli
    ];

    for (const path of paths) {
      try {
        const pkg = JSON.parse(readFileSync(path, "utf-8"));
        return pkg.version || "unknown";
      } catch {
        // Try next path
      }
    }

    return "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Get version information for the bundle
 */
export function getVersionInfo(): VersionInfo {
  const githubUrl = "https://github.com/tokens-studio/tokenscript-schemas";
  const packageVersion = getPackageVersion();

  let version: string;
  let isLocal: boolean;

  if (IS_BUILT) {
    // Running from built package - use package version
    version = `@tokens-studio/tokenscript-schemas@v${packageVersion}`;
    isLocal = false;
  } else {
    // Running locally (via tsx) - use git SHA
    const sha = getGitSha();
    version = sha ? `local-${sha}` : "local";
    isLocal = true;
  }

  return {
    version,
    githubUrl,
    isLocal,
  };
}
