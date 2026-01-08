# Custom Schemas Example

This example demonstrates how to use custom schema directories with the TokenScript Schema Registry bundler.

## Use Case

When developing new color schemas that aren't ready for the main repository yet, you can:
1. Create them in a separate directory
2. Bundle them using the `--schemas-dir` option
3. Test them without modifying the main codebase

## Directory Structure

```
custom-schemas/
├── types/
│   └── custom-gradient/
│       ├── schema.json
│       ├── gradient-initializer.tokenscript
│       └── to-css.tokenscript
└── functions/
    └── blend-gradient/
        ├── schema.json
        └── blend.tokenscript
```

## Example

## Usage

### 1. Bundle from Custom Directory

```bash
# Bundle specific schemas from custom directory
npm run cli -- bundle type:custom-gradient -o ./output.js --schemas-dir ./examples/custom-schemas-example/custom-schemas
```

### 2. Use in Your Application

```typescript
import { makeConfig } from "./output.js";

const config = makeConfig();

// Now you can use your custom schemas with the interpreter
// const interpreter = new Interpreter(code, {}, config);
```
