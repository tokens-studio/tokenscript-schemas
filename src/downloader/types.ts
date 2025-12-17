/**
 * Types for schema downloader
 */

export interface LatestVersion {
  id: string;
  version: string;
  created_at: string;
}

export interface SchemaListItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  license_name: string | null;
  type: "type" | "function";
  latest: LatestVersion;
}

export interface SchemaVersion {
  id: string;
  type: "type" | "function";
  schema: string;
  slug: string;
  version: string;
  content: unknown;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SchemaDetails {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: "type" | "function";
  version: string;
  content: unknown;
  metadata?: Record<string, unknown>;
}

export interface SchemaConfig {
  apiBaseUrl: string;
  outputDir: string;
  targetVersion: string;
}
