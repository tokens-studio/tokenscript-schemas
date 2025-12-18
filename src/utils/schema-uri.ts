/**
 * Utilities for working with TokenScript schema URIs
 *
 * Handles URI construction, parsing, and manipulation for the TokenScript schema registry.
 */

import { isObject } from "./type";

export type SemanticVersion =
  | { major: number }
  | { major: number; minor: number }
  | { major: number; minor: number; patch: number };

type SchemaVersion = "latest" | SemanticVersion | null;

export interface SchemaUriComponents {
  baseUrl: string;
  category: "schema" | "core" | "function";
  name: string;
  version: SchemaVersion;
}

export const DEFAULT_REGISTRY_URL = "https://schema.tokenscript.dev.gcp.tokens.studio";

export const DEFAULT_API_PATH = "/api/v1";

function safeParseInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function parseSemverFromString(versionString: string): SemanticVersion | null {
  const parts = versionString.split(".");
  const numbers: number[] = [];

  for (const part of parts) {
    const num = safeParseInt(part);
    if (num === null) return null;
    numbers.push(num);
  }

  if (numbers.length !== parts.length) return null;

  if (numbers.length === 3) {
    return { major: numbers[0], minor: numbers[1], patch: numbers[2] };
  }

  if (numbers.length === 2) {
    return { major: numbers[0], minor: numbers[1] };
  }

  if (numbers.length === 1) {
    return { major: numbers[0] };
  }

  return null;
}

export function parseVersionString(versionString: string): SchemaVersion {
  return versionString === "latest" ? "latest" : parseSemverFromString(versionString);
}

export function semverToString(version: SchemaVersion | undefined): string {
  if (version === undefined) {
    return "latest";
  }
  if (isObject(version)) {
    if ("patch" in version) return `${version.major}.${version.minor}.${version.patch}`;
    if ("minor" in version) return `${version.major}.${version.minor}`;
    return `${version.major}`;
  }
  return "latest";
}

export function buildSchemaUri(
  params: Partial<SchemaUriComponents> & { category: string; name: string },
): string {
  const { baseUrl, category, name, version } = params;

  const versionString = semverToString(version);

  const effectiveBaseUrl = baseUrl === undefined ? DEFAULT_REGISTRY_URL : baseUrl;

  if (effectiveBaseUrl === "") {
    return `${DEFAULT_API_PATH}/${category}/${name}/${versionString}/`;
  }

  return `${effectiveBaseUrl}${DEFAULT_API_PATH}/${category}/${name}/${versionString}/`;
}

/**
 * Parse a schema URI into its components
 *
 * @example
 * parseSchemaUri("https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/schema/rgb-color/0.0.1/")
 * // => { baseUrl: "...", category: "schema", name: "rgb-color", version: "0.0.1" }
 *
 * parseSchemaUri("/api/v1/schema/rgb-color/0.0.1/")
 * // => { baseUrl: "", category: "schema", name: "rgb-color", version: "0.0.1" }
 */
export function parseSchemaUri(uri: string): SchemaUriComponents | null {
  let baseUrl = "";
  let pathname = uri;

  // Try parsing as full URL first
  try {
    const url = new URL(uri);
    baseUrl = `${url.protocol}//${url.host}`;
    pathname = url.pathname;
  } catch {
    // If URL parsing fails, treat as relative path
    // Check if it starts with a protocol (incomplete URL)
    if (uri.includes("://")) {
      return null;
    }
    // It's a relative path, use as-is
    pathname = uri;
  }

  // Parse pathname: /api/v1/schema/rgb-color/0.0.1/
  const pathParts = pathname.split("/").filter((part) => part !== "");

  // Expected format: [api, v1, category, name, version]
  if (pathParts.length < 5) {
    return null;
  }

  // Check if it starts with api/vN
  if (pathParts[0] !== "api" || !pathParts[1].startsWith("v")) {
    return null;
  }

  const category = pathParts[2];
  if (category !== "schema" && category !== "core" && category !== "function") {
    return null;
  }

  const name = pathParts[3];
  const version = parseVersionString(pathParts[4]);

  return {
    baseUrl,
    category: category as "schema" | "core" | "function",
    name,
    version,
  };
}

/**
 * Extract the base URI without version
 *
 * @example
 * getBaseUri("https://.../api/v1/schema/rgb-color/0.0.1/")
 * // => "https://.../api/v1/schema/rgb-color/"
 *
 * getBaseUri("/api/v1/schema/rgb-color/0.0.1/")
 * // => "/api/v1/schema/rgb-color/"
 */
export function getBaseUri(uri: string): string {
  const components = parseSchemaUri(uri);

  if (!components) {
    return uri;
  }

  const { baseUrl, category, name } = components;

  if (baseUrl === "") {
    return `${DEFAULT_API_PATH}/${category}/${name}/`;
  }

  return `${baseUrl}${DEFAULT_API_PATH}/${category}/${name}/`;
}

/**
 * Extract schema name from URI
 *
 * @example
 * extractSchemaName("https://.../api/v1/schema/rgb-color/0.0.1/")
 * // => "rgb-color"
 */
export function extractSchemaName(uri: string): string | null {
  const components = parseSchemaUri(uri);
  return components?.name || null;
}

/**
 * Normalize URI to ensure it ends with trailing slash
 */
export function normalizeUri(uri: string): string {
  return uri.endsWith("/") ? uri : `${uri}/`;
}
