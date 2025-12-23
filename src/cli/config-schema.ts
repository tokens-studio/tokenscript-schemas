/**
 * Config file schema validation
 */

export interface BundleConfig {
  schemas: string[];
  output?: string;
}

/**
 * Validate bundle config
 */
export function validateBundleConfig(data: unknown): BundleConfig {
  if (typeof data !== "object" || data === null) {
    throw new Error("Config must be an object");
  }

  const config = data as Record<string, unknown>;

  if (!Array.isArray(config.schemas)) {
    throw new Error("Config must have a 'schemas' array");
  }

  if (!config.schemas.every((s) => typeof s === "string")) {
    throw new Error("All schemas must be strings");
  }

  if (config.output !== undefined && typeof config.output !== "string") {
    throw new Error("Config 'output' must be a string if provided");
  }

  return {
    schemas: config.schemas,
    output: config.output as string | undefined,
  };
}
