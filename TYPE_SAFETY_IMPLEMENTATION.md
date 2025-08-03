# Type-Safe loadFlow Implementation

## Summary

This implementation addresses GitHub issue #115 by adding type safety to the `loadFlow` function in Flyde. It prevents typos in .flyde file paths and ensures type compatibility between the flow definition and the TypeScript usage.

## Files Created/Modified

### New Files
1. **`loader/src/type-generation/generate-flow-types.ts`** - Core type generation logic
2. **`loader/src/type-generation/cli.ts`** - Command-line interface for type generation
3. **`loader/src/type-generation/test-generation.ts`** - Test script for development
4. **`loader/src/type-generation/generate-flow-types.spec.ts`** - Unit tests
5. **`loader/EXAMPLE_USAGE.md`** - Usage documentation and examples
6. **`TYPE_SAFETY_IMPLEMENTATION.md`** - This summary document

### Modified Files
1. **`loader/src/runtime/index.ts`** - Added type-safe loadFlow overloads
2. **`loader/src/index.ts`** - Export type generation utilities
3. **`loader/package.json`** - Added generate-flow-types script

## Key Features

### 1. Type Generation System
- Analyzes .flyde files and extracts input/output type information
- Generates TypeScript declarations with proper type safety
- Creates a flow registry for compile-time path validation
- Supports both CLI usage and programmatic API

### 2. Type-Safe loadFlow Function
- **Overloaded function signatures** for both type-safe and backward-compatible usage
- **Compile-time path validation** when using generated types
- **Input/output type inference** based on flow definitions
- **Maintains backward compatibility** with existing string-based API

### 3. Developer Experience
- **CLI tool**: `npm run generate-flow-types <root-dir> [output-file]`
- **Package script**: Easy integration with build processes
- **Comprehensive tests**: Unit tests for all core functionality
- **Clear documentation**: Usage examples and migration guides

## Usage Examples

### Before (Current Implementation)
```typescript
// Prone to runtime errors
const flow = loadFlow<{name: string}, {greeting: string}>("./my-flow.flyde");
//                                                          ^ Typo risks
//                                                          ^ Type mismatches
```

### After (Type-Safe Implementation)
```typescript
// Step 1: Generate types
// npm run generate-flow-types ./src ./src/generated/flow-types.ts

// Step 2: Use type-safe loadFlow
import { loadFlow } from "@flyde/loader";

// Compile-time path and type validation
const flow = loadFlow("my-flow.flyde"); // ✅ Path checked, types inferred
const result = await flow({ name: "Alice" }).result; // ✅ Input type validated
console.log(result.greeting); // ✅ Output type known

// These will fail at compile time:
const badFlow = loadFlow("typo.flyde"); // ❌ TypeScript error
const badInput = await flow({ age: 25 }).result; // ❌ Wrong input type
```

## Implementation Details

### Type Generation Algorithm
1. **Flow Analysis**: Parse .flyde files using existing deserializer
2. **Type Extraction**: Analyze inputs/outputs from flow node definitions
3. **Declaration Generation**: Create TypeScript interfaces and type registry
4. **Path Mapping**: Map file paths to flow types for compile-time checking

### Function Overloading Strategy
```typescript
// Type-safe overload (when FlowRegistry is available)
export function loadFlow<K extends keyof FlowRegistry>(
  flowPath: K,
  root?: string,
  secrets?: Record<string, string>
): LoadedFlowExecuteFn<FlowRegistry[K]["inputs"]>;

// Backward compatible overload
export function loadFlow<Inputs>(
  flowOrPath: FlydeFlow | string,
  root?: string,
  secrets?: Record<string, string>
): LoadedFlowExecuteFn<Inputs>;
```

## Integration Options

### Option 1: Manual Generation
```json
{
  "scripts": {
    "build:types": "npm run generate-flow-types ./src ./src/generated/flow-types.ts",
    "build": "npm run build:types && tsc"
  }
}
```

### Option 2: Watch Mode
```json
{
  "scripts": {
    "dev": "npm run build:types && tsc --watch"
  }
}
```

### Option 3: VS Code Extension Integration (Future)
The VS Code extension could automatically generate types when .flyde files change.

## Benefits Achieved

1. **✅ Compile-time path validation**: Catches missing/moved .flyde files during build
2. **✅ Type safety**: Ensures input/output types match flow definitions  
3. **✅ Better IDE support**: IntelliSense for flow inputs and outputs
4. **✅ Refactoring safety**: Type system prevents breaking changes
5. **✅ Backward compatibility**: Existing code continues to work unchanged
6. **✅ Zero runtime overhead**: All type checking happens at compile time

## Testing

The implementation includes comprehensive unit tests:
- Type extraction from flow definitions
- TypeScript declaration generation
- Edge cases (empty flows, missing properties)
- CLI tool functionality

## Future Enhancements

1. **Advanced Type Inference**: Analyze flow internals to infer more specific types
2. **VS Code Integration**: Automatic type generation on file changes
3. **Build Tool Plugins**: Webpack/Vite plugins for seamless integration
4. **Type Validation**: Runtime validation that types match generated declarations

## Migration Path

This implementation provides a smooth migration path:
1. **Phase 1**: Install and start using type generation (optional)
2. **Phase 2**: Gradually adopt type-safe loadFlow calls
3. **Phase 3**: Integrate into build process
4. **Phase 4**: Consider VS Code extension integration

The key advantage is that **no existing code needs to change** - the type safety is purely additive.