/**
 * Types for schema bundler
 */

export interface SchemaFile {
  path: string;
  content: string;
}

export interface SchemaBundle {
  slug: string;
  name: string;
  type: "type" | "function";
  version: string;
  schema?: unknown;
  scripts: Record<string, string>;
  metadata: {
    id: string;
    description: string;
    contentType: string | null;
    originalVersion: string;
  };
}

export interface BundledRegistry {
  version: string;
  types: SchemaBundle[];
  functions: SchemaBundle[];
  metadata: {
    generatedAt: string;
    totalSchemas: number;
  };
}
