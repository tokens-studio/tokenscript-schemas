# @tokenscript/schema-registry

Schema registry test setup for TokenScript with bundled schemas and validation.

## Overview

This package provides a centralized registry of TokenScript schemas with tools to:

- **Organize** schemas in a clean, testable structure with file-based script references
- **Bundle** schemas for distribution with shared bundling logic
- **Load** schemas at runtime with automatic bundling
- **Test** schema implementations without requiring a build step

## Usage

## Structure

Each schema is self-contained in its own folder with file-based script references:

```
src/schemas/types/srgb-color/
├── schema.json                    # Complete schema definition (with file references)
├── srgb-initializer.tokenscript   # Initializer script
├── from-hex-color.tokenscript     # Conversion: HEX → SRGB
├── to-hex-color.tokenscript       # Conversion: SRGB → HEX
└── unit.test.ts                   # Co-located tests
```

**Key Points:**
- `schema.json` contains the complete schema definition with script references like `"./filename.tokenscript"`
- Scripts are standalone `.tokenscript` files for better readability and syntax highlighting
- Tests use runtime bundling - no build step required
- The bundler inlines script content for distribution

## Scripts

### Bundle Schemas

```bash
npm run bundle
```

Bundles all schemas using the **shared bundling logic** from `@/bundler/bundle-schema.ts`:
- Reads `schema.json` from each schema directory
- Finds all `./file.tokenscript` references in the schema
- Reads and inlines the script file content
- Outputs bundled schemas to `bundled/` directory:
  - `registry.json` - Complete registry
  - `types.json` - All type schemas
  - `functions.json` - All function schemas
  - `types/{slug}.json` - Individual type schemas
  - `functions/{slug}.json` - Individual function schemas

### Run Tests

```bash
npm test
```

- Tests use `bundleSchemaFromDirectory()` from `@/bundler/bundle-schema.ts`
- No build step required - schemas are bundled on-demand
- Same bundling logic as build-time for consistency

## API Endpoint

Schemas are fetched from:

```
https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/schema/?format=json
```

## Links

- [TokenScript Interpreter](https://github.com/tokens-studio/tokenscript-interpreter)
- [Schema API](https://schema.tokenscript.dev.gcp.tokens.studio/)
- [AGENTS.md](./AGENTS.md) - Detailed guide for AI agents
- [TESTING.md](./TESTING.md) - Comprehensive testing documentation
