# Testing Schema Registry

## Overview

This repository implements unit tests for TokenScript schemas with runtime bundling.

## Structure

```
src/schemas/types/srgb-color/
├── schema.json                    # Main schema definition (with file references)
├── srgb-initializer.tokenscript   # Initializer script
├── from-hex-color.tokenscript     # HEX → SRGB conversion
├── to-hex-color.tokenscript       # SRGB → HEX conversion
└── unit.test.ts                   # Test suite

tests/helpers/
├── schema-loader.ts               # Load schemas from source
└── schema-test-utils.ts           # Test utilities

src/bundler/
├── index.ts                       # Main bundler
├── bundle-schema.ts               # Shared bundling logic
├── types.ts                       # Type definitions
└── utils.ts                       # Bundler utilities
```

## Schema Format

Schemas follow the typescript-interpreter format with local file references:

```json
{
  "name": "SRGB",
  "type": "color",
  "schema": { /* JSON schema */ },
  "initializers": [{
    "keyword": "srgb",
    "script": {
      "type": "https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/core/tokenscript/0/",
      "script": "./srgb-initializer.tokenscript"
    }
  }],
  "conversions": [{
    "source": "...",
    "target": "$self",
    "script": {
      "script": "./from-hex-color.tokenscript"
    }
  }]
}
```

## Bundling

### Build-time Bundling
```bash
npm run bundle
```
Creates bundled schemas in `bundled/` directory with inlined scripts.

### Runtime Bundling (for tests)
The test helpers use the same bundling logic:
- `bundleSchemaFromDirectory()` - shared function used by both
- Inline all `./file.tokenscript` references
- Register with ColorManager

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific schema tests
npm test -- src/schemas/types/srgb-color/unit.test.ts
```

### Test Structure

Tests verify:
1. **Schema Definition** - structure and metadata
2. **Initialization** - color object creation
3. **Conversions** - bidirectional color space transformations
4. **Round-trip** - lossless conversion chains
5. **Identity** - same-type conversions

### Example Test
```typescript
import { describe, expect, it } from "vitest";
import {
  setupColorManagerWithSchema,
  createInterpreter,
  getBundledSchema,
  Config,
} from "../../../../tests/helpers/schema-test-utils.js";

describe("SRGB Color Schema", () => {
  it("should convert HEX to SRGB", async () => {
    const colorManager = await setupColorManagerWithSchema("srgb-color");
    const config = new Config({ colorManager });

    const code = `
      variable c: Color.Hex = #ff5733;
      c.to.srgb()
    `;

    const interpreter = createInterpreter(code, {}, config);
    const result = interpreter.interpret();

    expect(result?.constructor.name).toBe("ColorSymbol");
    expect((result as any).subType).toBe("SRGB");
    expect((result as any).value.r.value).toBe(255);
  });
});
```

## Dependencies

- `@tokens-studio/tokenscript-interpreter` - Published npm package (^0.16.0)
- All test helpers are local to this repo
- No imports from other repo source files

## Common Issues

### Method naming
TokenScript uses snake_case for built-in methods:
- ✓ `to_string()` 
- ✗ `toString()`
- ✓ `parse_int()`
- ✗ `parseInt()`

### Color values
Color properties return NumberSymbol objects, not plain numbers:
```typescript
// Access the underlying value
expect((result as any).value.r.value).toBe(255);
```
