# @tokens-studio/tokenscript-schemas

Schema registry test setup for TokenScript with bundled schemas and validation.

## Overview

This package provides a centralized registry of TokenScript schemas with tools to:

- **Organize** schemas in a clean, testable structure with file-based script references
- **Bundle** schemas for distribution with shared bundling logic
- **Load** schemas at runtime with automatic bundling
- **Test** schema implementations without requiring a build step

## Usage

### CLI Tool

Bundle specific schemas for use in your projects with automatic dependency resolution:

```bash
# Bundle specific color schemas
npx @tokens-studio/tokenscript-schemas bundle oklch-color rgb-color -o ./schemas.js

# Bundle with functions
npx @tokens-studio/tokenscript-schemas bundle rgb-color function:invert -o ./schemas.js

# Use config file for repeatable builds
npx @tokens-studio/tokenscript-schemas bundle --config schemas.json

# Preview what would be bundled (dry-run)
npx @tokens-studio/tokenscript-schemas bundle oklch-color rgb-color --dry-run

# List available schemas
npx @tokens-studio/tokenscript-schemas list
npx @tokens-studio/tokenscript-schemas list --types
npx @tokens-studio/tokenscript-schemas list --functions
```

**Config File Format** (`schemas.json`):

```json
{
  "schemas": ["oklch-color", "rgb-color", "function:invert"],
  "output": "./src/generated/schemas.js"
}
```

**Generated Output** (`schemas.js`):

```javascript
import { Config } from "@tokens-studio/tokenscript-interpreter";

export const SCHEMAS = [
  { uri: "https://schema.../rgb-color/0/", schema: { /* bundled schema */ } },
  { uri: "https://schema.../oklch-color/0/", schema: { /* bundled schema */ } },
  // ... all dependencies included
];

export function makeConfig() {
  return new Config().registerSchemas(SCHEMAS);
}
```

**Using in Your Code**:

```javascript
import { makeConfig } from "./schemas.js";
import { Interpreter, Lexer, Parser } from "@tokens-studio/tokenscript-interpreter";

const config = makeConfig();

const code = `
  variable c: Color.Rgb = rgb(255, 128, 64);
  c.to.oklch()
`;

const lexer = new Lexer(code);
const parser = new Parser(lexer);
const interpreter = new Interpreter(parser, { config });
const result = interpreter.interpret();
```

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
# Run all tests (logs disabled by default)
npm test

# Run tests with verbose logging
npm run test:verbose
# or
LOG_LEVEL=info npm test

# Run tests with debug logging
npm run test:debug
# or
LOG_LEVEL=debug npm test

# Run specific test file
npm test -- src/schemas/types/rgb-color/unit.test.ts
```

**Test Logging:**
- Logs are **disabled by default** to reduce noise (only errors shown)
- Use `LOG_LEVEL` environment variable to enable logs: `debug`, `info`, `warn`, `error`
- See [tests/helpers/LOGGING.md](tests/helpers/LOGGING.md) for detailed logging documentation
- Tests use `bundleSchemaFromDirectory()` from `@/bundler/bundle-schema.ts`
- No build step required - schemas are bundled on-demand
- Same bundling logic as build-time for consistency

## Links

- [TokenScript Interpreter](https://github.com/tokens-studio/tokenscript-interpreter)
- [Schema API](https://schema.tokenscript.dev.gcp.tokens.studio/)
