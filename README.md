# @tokenscript/schema-registry

Schema registry for TokenScript with bundled schemas and validation.

## Overview

This package provides a centralized registry of TokenScript schemas with tools to:
- **Download** schemas from the TokenScript schema API
- **Organize** schemas in a clean, testable structure
- **Bundle** schemas for distribution
- **Load** schemas at runtime
- **Test** schema implementations

## Installation

```bash
npm install @tokenscript/schema-registry
```

## Usage

### Loading Schemas at Runtime

```typescript
import { loadRegistry, loadSchema } from '@tokenscript/schema-registry';

// Load the complete registry
const registry = await loadRegistry();
console.log(`Total schemas: ${registry.metadata.totalSchemas}`);

// Load a specific schema
const rgbaColor = await loadSchema('rgba-color', 'type');
console.log(rgbaColor.scripts['to-hex-color']);

// Load all type schemas
import { loadTypes } from '@tokenscript/schema-registry';
const types = await loadTypes();

// Load all function schemas
import { loadFunctions } from '@tokenscript/schema-registry';
const functions = await loadFunctions();
```

### Using in Tests

```typescript
import { Interpreter } from '@tokens-studio/tokenscript-interpreter';
import { loadSchemaFromSource } from './tests/helpers/schema-loader.js';

// Load schema directly from source (no build needed)
const schema = await loadSchemaFromSource('rgba-color', 'type');
const script = schema.scripts['to-hex-color'];

// Execute with interpreter
const interpreter = new Interpreter();
const result = await interpreter.execute(script, { input: '#FF0000' });
```

## Structure

Each schema is self-contained in its own folder:

```
schemas/types/rgba-color/
├── schema.json                 # Metadata (id, name, version, type)
├── schema-definition.json      # JSON Schema definition
├── to-hex-color.tokenscript   # Conversion: HEX → RGBA
├── from-hex-color.tokenscript # Conversion: RGBA → HEX
├── to-rgb-color.tokenscript   # Conversion: RGB → RGBA
├── from-rgb-color.tokenscript # Conversion: RGBA → RGB
└── unit.test.ts               # Co-located tests
```

### Available Schemas

#### Type Schemas (4)
- **rgba-color** - RGBA color type with HEX/RGB conversions
- **hsl-color** - HSL color type with SRGB conversions
- **oklch-color** - OKLCH color type with RGB conversions
- **srgb-color** - SRGB color type

#### Function Schemas (11)
- **contrast** - Calculate WCAG contrast ratio
- **contrast-color** - Find contrasting color
- **hsl-color-scale** - Generate HSL color scale
- **hsl-desaturate** - Desaturate HSL colors
- **hsl-ramp** - Generate HSL color ramp
- **invert** - Invert colors
- **oklch-ramp** - Generate OKLCH color ramp
- **relative-darken** - Darken colors relatively
- **remap** - Remap values
- **snap** - Snap values to grid
- **test-color-scale-rainbow** - Rainbow color scale test

## Scripts

### Download Schemas

```bash
npm run download
```

Downloads all schemas from the TokenScript API and organizes them into the `src/schemas` directory.

### Update Versions

```bash
npm run update-versions
```

Updates all schema versions to the target version (currently 0.0.10).

### Bundle Schemas

```bash
npm run bundle
```

Bundles all schemas into distributable JSON files in the `bundled/` directory:
- `registry.json` - Complete registry
- `types.json` - All type schemas
- `functions.json` - All function schemas
- `types/{slug}.json` - Individual type schemas
- `functions/{slug}.json` - Individual function schemas

### Build Package

```bash
npm run build
```

Builds the TypeScript package to the `dist/` directory.

### Run Tests

```bash
npm test
```

Runs all tests using Vitest. Tests load schemas directly from source without requiring a build.

## Development Guidelines

### Code Quality
- Keep functions clean - move side-effects and IO to the top
- Separate pure logic from effects for better testability
- Use type utilities from `@tokens-studio/tokenscript-interpreter`

### Testing
- Tests focus on logic, not content validation
- Use `tests/helpers/schema-loader.ts` to load schemas in tests
- No build required for running tests
- Co-locate tests with schemas for easy maintenance

### Schema Organization
- Each schema in its own folder
- All files at the same level (flat structure)
- Schema definition + implementation + tests together
- Self-contained and independently testable

## API Endpoint

Schemas are fetched from:
```
https://schema.tokenscript.dev.gcp.tokens.studio/api/v1/schema/?format=json
```

## Package Contents

When published, the package includes:
- `dist/` - Compiled TypeScript
- `bundled/` - Pre-bundled schema JSON files
- Type definitions for TypeScript

## Contributing

1. Download latest schemas: `npm run download`
2. Make your changes
3. Run tests: `npm test`
4. Bundle schemas: `npm run bundle`
5. Build package: `npm run build`

## License

MPL-2.0

## Links

- [TokenScript Interpreter](https://github.com/tokens-studio/tokenscript-interpreter)
- [Schema API](https://schema.tokenscript.dev.gcp.tokens.studio/)
