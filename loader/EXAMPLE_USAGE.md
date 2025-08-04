# Type-Safe Flow Loading

This enhancement adds type safety to the `loadFlow` function to prevent runtime errors when loading .flyde files.

## Problem Solved

Before this enhancement:
```typescript
// Current issue: String paths lack compile-time validation
const flow = loadFlow<{name: string}, {greeting: string}>("./my-flow.flyde");
//                                                          ^ Typo in path - will fail at runtime
//                                                          ^ Type mismatch with actual flow - will fail at runtime
```

Problems:
1. **Path typos**: `"./my-flow.flyde"` might not exist but TypeScript won't catch it
2. **Type mismatches**: Generic types might not match the actual flow inputs/outputs
3. **Refactoring issues**: Moving .flyde files breaks imports without compile-time errors

## Solution

### 1. Type Generation

Generate TypeScript declarations from .flyde files:

```bash
# Generate types for all .flyde files in a directory
npx generate-flow-types ./src ./src/generated/flow-types.ts
```

This creates a type registry:
```typescript
// Auto-generated flow-types.ts
export interface MyFlowInputs {
  name: string; // Input from flow definition
}

export interface MyFlowOutputs {
  greeting: string; // Output from flow definition
}

export type MyFlowFlow = {
  inputs: MyFlowInputs;
  outputs: MyFlowOutputs;
  path: "my-flow.flyde";
};

export type FlowRegistry = {
  "my-flow.flyde": MyFlowFlow;
  "other-flow.flyde": OtherFlowFlow;
  // ... all flows in the directory
};
```

### 2. Type-Safe Loading

Import the generated types and use type-safe loadFlow:

```typescript
import { loadFlow } from "@flyde/loader";
// The FlowRegistry type will be automatically imported when available

// Type-safe version - path and types are validated at compile time
const flow = loadFlow("my-flow.flyde"); // ✅ Path checked, types inferred
const result = await flow({ name: "Alice" }).result; // ✅ Input type validated
console.log(result.greeting); // ✅ Output type known

// This will fail at compile time:
const badFlow = loadFlow("non-existent.flyde"); // ❌ TypeScript error
const badResult = await flow({ age: 25 }).result;  // ❌ Wrong input type
```

### 3. Backward Compatibility

The original string-based API still works:

```typescript
// Still supported for dynamic paths or when types aren't generated
const dynamicFlow = loadFlow<{input: string}, {output: number}>(dynamicPath);
```

## Integration with Development Workflow

### Option 1: Build Script Integration

Add to `package.json`:
```json
{
  "scripts": {
    "build:types": "generate-flow-types ./src ./src/generated/flow-types.ts",
    "build": "npm run build:types && tsc",
    "dev": "npm run build:types && tsc --watch"
  }
}
```

### Option 2: VS Code Extension Integration

The VS Code extension could automatically generate types when .flyde files change, similar to how it currently provides real-time validation.

## Benefits

1. **Compile-time path validation**: Catch missing or moved .flyde files during build
2. **Type safety**: Ensure input/output types match the actual flow definition
3. **Better IDE support**: IntelliSense for flow inputs and outputs
4. **Refactoring safety**: Renaming flows updates all references
5. **Documentation**: Generated types serve as living documentation

## Migration Path

1. **Phase 1**: Add type generation tooling (this PR)
2. **Phase 2**: Integrate with VS Code extension for automatic generation
3. **Phase 3**: Add advanced type inference from flow analysis
4. **Phase 4**: Consider build-time path resolution for even better safety

## Example Flow Analysis

Given this .flyde file:
```yaml
---
node:
  inputs:
    name:
      mode: required
      description: "User's name"
  outputs:
    greeting:
      description: "Personalized greeting"
```

The generator produces:
```typescript
export interface MyFlowInputs {
  name: string; // User's name
}

export interface MyFlowOutputs {
  greeting: any; // Personalized greeting
}
```

Future enhancements could infer more specific types by analyzing the flow's internal logic.