/**
 * Get version information for the bundled output
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
 * Check if we're running from a local git repo
 */
function isGitRepo(): boolean {
  try {
    execSync("git rev-parse --git-dir", {
      stdio: ["pipe", "pipe", "ignore"],
    });
    return true;
  } catch {
    return false;
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
  const isLocal = isGitRepo();

  let version: string;
  if (isLocal) {
    const sha = getGitSha();
    version = sha ? `local-${sha}` : "local";
  } else {
    version = getPackageVersion();
  }

  return {
    version,
    githubUrl,
    isLocal,
  };
}
