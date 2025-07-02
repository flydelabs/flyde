# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the `@flyde/core` package - the foundation package of the Flyde visual flow-based programming toolkit. It contains core type definitions, the execution engine, and fundamental utilities with no external Flyde dependencies. This package is consumed by all other Flyde packages.

## Common Development Commands

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the package
npm run build

# Development mode (watch TypeScript compilation)
npm run dev

# Lint the code
npm run lint

# Run a single test file
npm test src/path/to/file.spec.ts
```

## Architecture Overview

### Core Components

- **`src/execute/`**: RxJS-based reactive execution engine (`execute.ts`)
- **`src/node/`**: Node type definitions and utilities (`Node`, `NodeInstance`, `CodeNode`)
- **`src/types/`**: Core type definitions (`Flow`, `Pin`, `Connection`, etc.)
- **`src/connect/`**: Node connection and composition utilities
- **`src/common/`**: Shared utilities and helpers

### Key Files

- **`src/execute/index.ts`**: Main execution engine with reactive processing
- **`src/node/index.ts`**: Node type definitions and node instance management
- **`src/types/core.ts`**: Fundamental type definitions
- **`src/flow-schema.ts`**: Flow definition schema
- **`src/index.ts`**: Main package exports

### Execution Model

The core execution engine is built on RxJS and follows these principles:

1. **Reactive Execution**: All data flow is reactive using RxJS Subjects
2. **Node States**: Each node maintains isolated state during execution
3. **Pin Types**: Supports regular inputs, reactive inputs, and sticky outputs
4. **Completion Modes**: Implicit (all inputs satisfied) or explicit (specific outputs)
5. **Error Handling**: Errors propagate through dedicated error pins

### Node Types

- **Code Nodes**: TypeScript implementations with `run` functions
- **Visual Nodes**: Composed of other nodes with visual connections
- **Macro Nodes**: Dynamic nodes with configurable inputs/outputs

### Testing Strategy

- **Framework**: Mocha with Chai assertions and Sinon mocking
- **Pattern**: Test files use `.spec.ts` extension
- **Coverage**: NYC for coverage reporting with badge generation
- **Wallaby**: Continuous testing support configured

### Important Implementation Details

1. **No External Flyde Dependencies**: This package must remain dependency-free of other Flyde packages
2. **RxJS Version**: Uses RxJS v6 for reactive streams
3. **TypeScript First**: All code is written in TypeScript with full type safety
4. **State Management**: Uses Maps for node state with namespaced keys
5. **Debug Support**: Built-in debugging events and state tracking