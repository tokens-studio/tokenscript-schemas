# AGENTS.md

> Guide for AI agents working with the TokenScript Schema Registry

## Project Overview

This repository manages TokenScript color schemas with validation and unit testing. Schemas define color spaces (e.g., sRGB, HSL) and their conversions using the TokenScript language.

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
│   │   ├── bundle-schema.ts # SHARED bundling logic (used by build & tests)
│   │   ├── index.ts         # Build-time bundler
│   │   ├── types.ts
│   │   └── utils.ts
│   └── loader/
├── tests/
│   └── helpers/
│       ├── schema-loader.ts      # Load schemas from source
│       └── schema-test-utils.ts  # Test utilities (uses bundle-schema.ts)
├── bundled/                 # Build output (gitignored)
├── scripts/
│   ├── bundle-schemas.ts    # CLI bundler script
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

### 2. Bundling Process

**There is ONE shared bundling function** in `src/bundler/bundle-schema.ts`:

```typescript
export async function bundleSchemaFromDirectory(
  schemaDir: string
): Promise<ColorSpecification>
```

This function:
1. Reads `schema.json` from the directory
2. Finds all `./file.tokenscript` references
3. Reads the actual file content
4. Replaces the file path with the inlined content
5. Returns the bundled schema

**Two consumers:**
- **Build-time** (`src/bundler/index.ts`): Bundles all schemas → `bundled/` directory
- **Runtime** (`tests/helpers/schema-loader.ts`): Bundles on-demand for tests

### 3. TokenScript Language

**Syntax Rules:**
- Snake_case for built-in methods: `to_string()`, `parse_int()`, NOT `toString()`, `parseInt()`
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
5. **Bundle:** `npm run bundle`
6. **Test:** `npm test`

### Writing Tests

```typescript
import { describe, expect, it } from "vitest";
import {
  setupColorManagerWithSchema,
  createInterpreter,
  getBundledSchema,
  Config,
} from "../../../../tests/helpers/schema-test-utils.js";

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
# Build bundle
npm run bundle

# Run all tests
npm test

# Run specific test file
npm test -- src/schemas/types/srgb-color/unit.test.ts

# Type check
npm run ts:typecheck

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
```

## Critical Rules

### 1. **One Bundling Function**
Never duplicate bundling logic. Always use `bundleSchemaFromDirectory()` from `src/bundler/bundle-schema.ts`.

### 2. **No External Repo Imports**
Only import from:
- ✓ `@tokens-studio/tokenscript-interpreter` (published npm package)
- ✓ Local files within this repo
- ✗ NEVER import from `~/Code/My/items/tokenscript/typescript-interpreter/src/...`

### 3. **TokenScript File References**
In `schema.json`, always use relative paths:
```json
"script": "./filename.tokenscript"
```
NOT inline scripts in schema.json (they get inlined during bundling).

### 4. **Test Structure**
Every schema MUST have:
- Schema definition tests
- Initialization tests
- Conversion tests (all directions)
- Round-trip tests (A→B→A)
- Edge case tests

### 5. **File Organization**
Each schema type lives in its own directory with:
- ONE `schema.json`
- Multiple `.tokenscript` files (one per initializer/conversion)
- ONE `unit.test.ts`

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

### Issue: Bundle doesn't update
**Solution:** Always run `npm run bundle` after changing `.tokenscript` files

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

## Dependencies

```json
{
  "dependencies": {
    "@tokens-studio/tokenscript-interpreter": "^0.16.0",
    "arktype": "^2.1.25",
    "commander": "^14.0.1"
  },
  "devDependencies": {
    "vitest": "^3.2.4",
    "typescript": "^5.9.2",
    "tsup": "^8.5.0"
  }
}
```

## Architecture Decisions

### Why separate schema.json and .tokenscript files?
- **Readability**: Easier to read/write scripts in dedicated files
- **Syntax highlighting**: `.tokenscript` files get proper highlighting
- **Maintainability**: Clear separation of structure and logic
- **Version control**: Better diffs for script changes

### Why shared bundling logic?
- **DRY**: Single source of truth
- **Consistency**: Build and test use identical logic
- **Maintainability**: Fix once, works everywhere

### Why runtime bundling for tests?
- **Fast iteration**: No build step needed before testing
- **Isolation**: Each test gets fresh bundled schema
- **Debugging**: Easy to trace bundling issues

## Future Work

- [ ] Add more color schemas (RGBA, HSL, OKLCH, etc.)
- [ ] Add function schemas (contrast, ramp, etc.)
- [ ] Schema validation (JSON Schema or ArkType)
- [ ] Auto-generate TypeScript types from schemas
- [ ] Performance benchmarks for conversions

## Questions?

When working with this codebase, remember:
1. Use the shared bundling function
2. Follow TokenScript syntax (snake_case methods)
3. Access Symbol values with `.value`
4. Write comprehensive tests
5. Never import from other repos

See `TESTING.md` for detailed testing documentation.
