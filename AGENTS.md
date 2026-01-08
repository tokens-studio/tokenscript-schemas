# AGENTS.md

> Guide for AI agents working with the TokenScript Schema Registry

## Quick Reference

**Most Important Rules:**
1. ✅ Use path aliases: `@/` and `@tests/` (not relative paths)
2. ✅ Use `log` from `@tests/helpers/logger` for all logging (NEVER `console.log`)
3. ✅ Use snake_case in `.tokenscript` files (e.g., `rgb_color`, not `rgbColor`)

## Project Overview

This repository manages TokenScript color schemas with validation and unit testing. Schemas define color spaces (e.g., sRGB, HSL) and their conversions using the TokenScript language.

## Path Aliases

This project uses TypeScript path aliases for cleaner imports:

- **`@/*`** → `./src/*` - For all source code
- **`@tests/*`** → `./tests/*` - For test helpers

**Examples:**
```typescript
// ✓ Use aliases
import { bundleSchemaFromDirectory } from "@/bundler/bundle-schema";
import { setupColorManagerWithSchema } from "@tests/helpers/schema-test-utils";

// ✗ Don't use relative paths
import { bundleSchemaFromDirectory } from "../../src/bundler/bundle-schema";
import { setupColorManagerWithSchema } from "../../../../tests/helpers/schema-test-utils";
```

**Note:** Same-directory imports (e.g., `./types.js` within a module) can remain relative.

## Repository Structure

```
schema-registry/
├── src/
│   ├── schemas/
│   │   ├── types/           # Color type schemas
│   │   │   └── srgb-color/
│   │   │       ├── schema.json              # Schema definition with file refs
│   │   │       ├── srgb-initializer.tokenscript
│   │   │       ├── from-hex-color.tokenscript
│   │   │       ├── to-hex-color.tokenscript
│   │   │       └── unit.test.ts
│   │   └── functions/       # Function schemas
│   ├── bundler/
│   │   ├── build-schema.ts  # SHARED build logic (used by build & tests)
│   │   ├── index.ts         # Build-time builder (JSON registry)
│   │   ├── presets/         # Bundle presets
│   │   │   ├── index.ts
│   │   │   ├── css.ts
│   │   │   └── types.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── bundle.ts    # CLI bundle (JS file output)
│   │   │   ├── list.ts
│   │   │   └── presets.ts
│   │   ├── index.ts
│   │   ├── output-generator.ts
│   │   └── version-info.ts
│   └── loader/
├── tests/
│   └── helpers/
│       ├── schema-loader.ts      # Load schemas from source
│       └── schema-test-utils.ts  # Test utilities (uses build-schema.ts)
├── result/                  # Build output (gitignored)
├── scripts/
│   ├── build-schemas.ts     # Registry builder script
│   └── ...
└── package.json
```

## Key Concepts

### 1. Schema Format

Schemas follow the typescript-interpreter format:

```json
{
  "name": "SRGB",
  "type": "color",
  "description": "sRGB color",
  "schema": {
    "type": "object",
    "properties": {
      "r": { "type": "number" },
      "g": { "type": "number" },
      "b": { "type": "number" }
    },
    "required": ["r", "g", "b"],
    "additionalProperties": false
  },
  "initializers": [{
    "keyword": "srgb",
    "script": {
      "type": "https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/core/tokenscript/0/",
      "script": "./srgb-initializer.tokenscript"  // ← File reference
    }
  }],
  "conversions": [{
    "source": "https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/core/hex-color/0/",
    "target": "$self",
    "lossless": true,
    "script": {
      "type": "https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/core/tokenscript/0/",
      "script": "./from-hex-color.tokenscript"  // ← File reference
    }
  }]
}
```

**Key Points:**
- `schema.json` contains the schema definition
- Scripts are referenced via relative paths: `"./filename.tokenscript"`
- `$self` in `target` refers to the current schema
- Scripts are written in TokenScript language

### 2. Build Process

**There is ONE shared build function** in `@/bundler/build-schema.ts`:

```typescript
export async function buildSchemaFromDirectory(
  schemaDir: string
): Promise<ColorSpecification>
```

This function:
1. Reads `schema.json` from the directory
2. Finds all `./file.tokenscript` references
3. Reads the actual file content
4. Replaces the file path with the inlined content
5. Returns the built schema

**Two consumers:**
- **Build-time** (`@/bundler/index.ts`): Builds all schemas → `result/` directory (for distribution)
- **Test-time** (`@tests/helpers/schema-loader.ts`): Builds on-demand at runtime (no pre-build required)

### 3. Bundle Presets

Presets are predefined collections of schemas for common use cases. They live in `@/bundler/presets/`.

**Available Presets:**
- **`css`** - Modern CSS color types (CSS Color Level 4+)
  - Types: `css-color`, `hex-color`, `oklch-color`, `oklab-color`
  - Functions: `lighten`, `darken`, `mix`, `invert`, `to_gamut`, `contrast_ratio`

**Using Presets:**
```bash
# List all presets
npm run presets

# Bundle with a preset (CLI)
npm run cli -- bundle preset:css -o ./schemas.js

# Combine preset with specific schemas
npm run cli -- bundle preset:css type:lab-color function:saturate -o ./schemas.js
```

**Adding a New Preset:**

1. Create `src/bundler/presets/my-preset.ts`:
```typescript
import type { BundlePreset } from "./types";

export const myPreset: BundlePreset = {
  name: "My Preset",
  description: "Description of the preset",
  types: ["hex-color", "rgb-color"],
  functions: ["lighten", "darken"],
};
```

2. Export it in `src/bundler/presets/index.ts`:
```typescript
import { myPreset } from "./my-preset";

export const BUNDLE_PRESETS: Record<string, BundlePreset> = {
  css,
  "my-preset": myPreset,  // Add here
};
```

### 4. TokenScript Language

**Syntax Rules:**
- **Snake_case naming**: ALL variable names and built-in methods MUST use snake_case
  - Variables: `rgb_color`, `inverted_r`, `color_parts` NOT `rgbColor`, `invertedR`, `colorParts`
  - Built-in methods: `to_string()`, `parse_int()` NOT `toString()`, `parseInt()`
- Type annotations: `variable output: Color.SRGB;`
- Lists: `variable rgb: List = 0, 0, 0;`
- Conditionals: `if(condition) [ ... ] else [ ... ];`
- Loops: `while(condition) [ ... ];`

**Common Functions:**
- `parse_int(str, radix)` - Parse integer
- `to_string(radix)` - Convert to string
- `round(num)` - Round number
- `min(a, b)` - Minimum
- `.split(delimiter)` - Split string/list
- `.concat(str)` - Concatenate strings
- `.get(index)` - Get list item
- `.update(index, value)` - Update list item
- `.length()` - Get length

## Development Workflow

### Adding a New Schema

1. **Create schema directory:**
   ```
   src/schemas/types/my-color/
   ├── schema.json
   ├── my-initializer.tokenscript
   ├── conversion-a.tokenscript
   ├── conversion-b.tokenscript
   └── unit.test.ts
   ```

2. **Write schema.json** with file references
3. **Write TokenScript files** (pure script, no metadata headers)
4. **Write tests** using test helpers
5. **Build:** `npm run build-schemas`
6. **Test:** `npm test`

### Writing Tests

```typescript
import { describe, expect, it } from "vitest";
import {
  setupColorManagerWithSchema,
  createInterpreter,
  getBundledSchema,
  Config,
} from "@tests/helpers/schema-test-utils";

describe("My Color Schema", () => {
  it("should convert", async () => {
    const colorManager = await setupColorManagerWithSchema("my-color");
    const config = new Config({ colorManager });

    const code = `
      variable c: Color.Hex = #fff;
      c.to.mycolor()
    `;

    const interpreter = createInterpreter(code, {}, config);
    const result = interpreter.interpret();

    // Check result type
    expect(result?.constructor.name).toBe("ColorSymbol");
    expect((result as any).subType).toBe("MyColor");
    
    // Access values (they're Symbol objects)
    expect((result as any).value.prop.value).toBe(expectedValue);
  });
});
```

**Important:** Color properties return `NumberSymbol` objects, not plain numbers. Access values with `.value` property.

### Running Commands

```bash
# Run all tests (no bundling required!)
npm test

# Run specific test file
npm test -- src/schemas/types/rgb-color/unit.test.ts

# Type check
npm run ts:typecheck

# Lint
npm run lint
npm run lint:fix

# Format
npm run format

# Build schemas (JSON registry for distribution)
npm run build-schemas

# CLI commands (for JS file output - bundle command creates JS bundles)
npm run cli -- bundle preset:css -o ./schemas.js
npm run cli -- bundle type:hex-color function:lighten -o ./schemas.js

# Bundle from custom schema directory
npm run cli -- bundle type:my-custom-color -o ./schemas.js --schemas-dir ./path/to/custom/schemas

# List and presets
npm run cli -- list
npm run presets  # List all available presets
```

## Critical Rules

### 1. **Use Path Aliases**
Always use `@/` and `@tests/` aliases instead of relative paths:
```typescript
// ✓ Correct
import { buildSchemaFromDirectory } from "@/bundler/build-schema";
import { setupColorManagerWithSchema } from "@tests/helpers/schema-test-utils";

// ✗ Wrong
import { buildSchemaFromDirectory } from "../../src/bundler/build-schema";
```

### 2. **One Build Function**
Never duplicate build logic. Always use `buildSchemaFromDirectory()` from `@/bundler/build-schema.ts`.

### 3. **TokenScript Naming Convention**
ALL variables in `.tokenscript` files MUST use snake_case:
```tokenscript
// ✓ Correct
variable rgb_color: Color.SRGB;
variable inverted_r: Number;
variable color_parts: List;

// ✗ Wrong
variable rgbColor: Color.SRGB;
variable invertedR: Number;
variable colorParts: List;
```

### 4. **TokenScript File References**
In `schema.json`, always use relative paths:
```json
"script": "./filename.tokenscript"
```
NOT inline scripts in schema.json (they get inlined during bundling).

### 5. **Test Structure**
Every schema MUST have:
- Schema definition tests
- Initialization tests
- Conversion tests (all directions)
- Round-trip tests (A→B→A)
- Edge case tests

### 6. **File Organization**
Each schema type lives in its own directory with:
- ONE `schema.json`
- Multiple `.tokenscript` files (one per initializer/conversion)
- ONE `unit.test.ts`

### 7. **Logging in Tests**
**NEVER** use `console.log`, `console.warn`, or `console.error` in test files. Always use the centralized logger:

```typescript
import { log } from "@tests/helpers/logger";

// ✓ Correct
log.debug("Detailed diagnostic info");
log.info("Conversion result:", result);
log.warn("Schema not found, using fallback");
log.error("Critical error:", error);

// ✗ Wrong - Do NOT use console
console.log("Color conversion result:", result);
console.warn("Schema not found");
console.error("Error:", error);
```

**Why?**
- Tests are **silent by default** to avoid log pollution
- Logs only show when `LOG_LEVEL` is set: `LOG_LEVEL=info npm test`
- Keeps test output clean and readable

**Available log levels:**
- `log.debug()` - Detailed diagnostics (shown with `LOG_LEVEL=debug`)
- `log.info()` - Informational messages (shown with `LOG_LEVEL=info`)
- `log.warn()` - Warnings (shown with `LOG_LEVEL=warn`)
- `log.error()` - Errors (always shown, default level)

**Testing with logs:**
```bash
# Silent tests (default)
npm test

# Show info logs (parity comparisons, etc.)
LOG_LEVEL=info npm test

# Show all debug logs
LOG_LEVEL=debug npm test
```

See `tests/helpers/LOGGING.md` for complete documentation.

## Common Issues & Solutions

### Issue: "Method 'tostring' not found"
**Solution:** Use snake_case: `to_string()` not `toString()`

### Issue: "Unknown function: 'parseInt'"
**Solution:** Use snake_case: `parse_int()` not `parseInt()`

### Issue: Color value assertion fails
**Problem:**
```typescript
expect((result as any).value).toEqual({ r: 255, g: 128, b: 64 }); // ✗ Fails
```
**Solution:**
```typescript
expect((result as any).value.r.value).toBe(255); // ✓ Works
```

### Issue: Conversion not found
**Check:**
1. ColorManager has both schemas registered
2. Conversion source/target URIs match exactly
3. Script doesn't have syntax errors

## Testing Strategy

### Test Categories

1. **Schema Definition** - Validates JSON structure
2. **Initialization** - Color object creation
3. **Conversions** - Transform between color spaces
4. **Round-trips** - Lossless conversion chains
5. **Identity** - Same-type conversions
6. **Edge Cases** - Boundary values

### Test Helpers

```typescript
// Load and bundle a schema for testing
await getBundledSchema("schema-slug")

// Setup ColorManager with schema
await setupColorManagerWithSchema("schema-slug")

// Create interpreter
createInterpreter(code, references, config)
```

## Architecture Decisions

### Why separate schema.json and .tokenscript files?

- **Readability**: Easier to read/write scripts in dedicated files
- **Syntax highlighting**: `.tokenscript` files get proper highlighting
- **Maintainability**: Clear separation of structure and logic
- **Version control**: Better diffs for script changes

## Questions?

When working with this codebase, remember:
1. Always use `@/` and `@tests/` path aliases for imports
2. Use the shared build function from `@/bundler/build-schema.ts`
3. Follow TokenScript syntax (snake_case for ALL variables and methods)
4. Access Symbol values with `.value`
5. Write comprehensive tests
6. **Use `log` from `@tests/helpers/logger` - NEVER use `console.log`**
7. Never import from other repos
