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

// Color specification types matching typescript-interpreter format
export interface ScriptBlock {
  type: string;
  script: string;
}

export interface Initializer {
  title?: string;
  keyword: string;
  description?: string;
  schema?: unknown;
  script: ScriptBlock;
}

export interface Conversion {
  source: string;
  target: string;
  description?: string;
  lossless: boolean;
  script: ScriptBlock;
}

export interface SpecProperty {
  type: "number" | "string" | "color";
}

export interface SpecSchema {
  type: "object";
  properties: Record<string, SpecProperty>;
  required?: string[];
  order?: string[];
  additionalProperties?: boolean;
}

export interface ColorSpecification {
  name: string;
  type: "color";
  description?: string;
  schema?: SpecSchema;
  initializers: Initializer[];
  conversions: Conversion[];
  slug?: string; // Added for bundling purposes
}

export interface FunctionSpecification {
  name: string;
  type: "function";
  input?: {
    type: "object";
    properties?: Record<string, unknown>;
  };
  script: ScriptBlock;
  keyword: string;
  description?: string;
  requirements?: string[];
  slug?: string; // Added for bundling purposes
}

export type SchemaSpecification = ColorSpecification | FunctionSpecification;

export interface BundledRegistry {
  version: string;
  types: ColorSpecification[];
  functions: FunctionSpecification[];
  metadata: {
    generatedAt: string;
    totalSchemas: number;
    generatedBy: string;
  };
}
