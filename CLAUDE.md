# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flyde is a visual flow-based programming toolkit that integrates with TypeScript/JavaScript codebases. It consists of a VS Code extension for visual editing, runtime libraries for executing flows, and a web-based playground. The project uses a monorepo structure managed with pnpm workspaces.

## Common Development Commands

### Root Level Commands
```bash
pnpm install          # Install all dependencies
pnpm dev             # Run all packages in development mode concurrently
pnpm build           # Build all packages sequentially
pnpm test            # Run tests in all packages
pnpm lint            # Run linting across all packages
pnpm bump:patch      # Bump patch version across all packages
pnpm bump:minor      # Bump minor version across all packages
pnpm bump:alpha      # Bump to alpha version
```

### VS Code Extension Development
- Open the workspace file: `code main.code-workspace`
- Press F5 to launch a new VS Code window with the extension loaded
- The extension can be debugged in both dev and prod modes (see launch configurations)
- **Webview Development**: The extension uses a modern Vite-based webview for the flow editor
  - Run `pnpm dev-webview` for hot-reloaded webview development
  - Webview source is in `vscode-extension/src/webview/`
  - Built assets go to `vscode-extension/webview-dist/`

### Development Workflow
1. Always use `pnpm` for package management
2. Run `pnpm dev` at the root to start all packages in watch mode
3. The website runs on port 3003 in development mode
4. Test files use `.spec.ts` or `.spec.tsx` naming convention
5. **Any changes require a full build and visual test**: Run `pnpm run test:visual` from `vscode-extension/` directory

## Architecture Overview

### Package Dependency Hierarchy

```
@flyde/core (no Flyde dependencies)
    ↓
@flyde/loader
    ↓
@flyde/nodes & @flyde/loader & @flyde/flow-editor
    ↓
@flyde/dev-server
    ↓
@flyde/vscode-extension (consumes all packages)
```

### Core Packages

- **`core/`**: Foundation package containing:
  - Type definitions (`Node`, `NodeInstance`, `Flow`, `Pin`, `Connection`)
  - Execution engine (`execute.ts` - RxJS-based reactive execution)
  - Visual node models and utilities
  - No external Flyde dependencies

- **`editor/`**: React-based visual flow editor
  - Main component: `VisualNodeEditor.tsx`
  - Handles visual editing, node positioning, connections
  - Consumed by VS Code extension via modern Vite-based webview
  - Built with TypeScript and React, bundled with Vite

- **`runtime/`**: Node.js runtime for executing flows
  - Provides `loadFlow<T>()` function for TypeScript integration
  - Handles flow deserialization and execution
  - Integrates with debugger

- **`nodes/`**: Standard library of built-in nodes
  - Control flow (Conditional, Switch, Debounce, Throttle)
  - Data operations (Lists, Objects, HTTP)
  - AI integrations (OpenAI, Anthropic, Google, Groq)
  - File system operations
  - Each node is a `.flyde.ts` file with metadata

### Node Types and Capabilities

#### 1. Visual Nodes
- Created in the visual editor
- Contain instances of other nodes and connections between them
- Stored as `.flyde` files (YAML format)
- Can be imported and used like functions in TypeScript

#### 2. Code Nodes
- TypeScript implementations with a `run` function
- File naming: `*.flyde.ts`
- Structure:
```typescript
export const MyNode: CodeNode = {
  id: "MyNode",
  inputs: { value: { description: "Input value" } },
  outputs: { result: { description: "Output result" } },
  run: ({ value }, { result }) => {
    result.next(value.get() * 2);
  }
};
```

#### 3. Macro Nodes
- Advanced code nodes with dynamic pins
- Can generate inputs/outputs based on configuration
- Support custom UI components for node configuration
- Example: HTTP node that shows different inputs based on method

### Node Execution Model

1. **Reactive Execution**: Built on RxJS Subjects
2. **Pin Types**:
   - Regular inputs: Wait for value
   - Reactive inputs: Re-execute on changes
   - Sticky outputs: Retain last emitted value
3. **Completion Modes**:
   - Implicit: Complete when all required inputs satisfied
   - Explicit: Complete when specific outputs emit
4. **State Management**:
   - Each node instance has isolated state
   - Global state can be shared via context
5. **Error Handling**: Errors propagate through error pins

### Flow Integration in TypeScript

```typescript
import { loadFlow } from "@flyde/loader";

// Load a flow file
const myFlow = loadFlow<{input: string}, {output: number}>("./MyFlow.flyde");

// Execute the flow
const result = await myFlow({input: "test"}).result;

// Or with observables
myFlow({input: "test"}).output.subscribe(value => {
  console.log(value);
});
```

### File Formats

- **`.flyde` files**: YAML-based flow definitions
- **`.flyde.ts` files**: Code node implementations
- **`ImportableSource`: Special marker for importable nodes

### Debugging and Development Tools

- **Remote Debugger**: Real-time flow execution visualization
- **Dev Server**: Hot-reloading development server
- **VS Code Integration**: 
  - Custom editor provider for `.flyde` files
  - Modern Vite-based webview for visual editor
  - Integrated debugging with real-time flow execution visualization
  - Direct integration with `@flyde/editor` (no intermediate packages)

### Important Implementation Details

1. **Never add comments to code unless crucial** (from Cursor rules)
2. **Main editor component**: `VisualNodeEditor.tsx` in editor
3. **Execution uses RxJS**: All data flow is reactive
4. **Resolution happens at runtime**: Nodes are resolved when flows load
5. **TypeScript integration**: Flows compile to executable functions
6. **VS Code Extension Architecture**: 
   - Uses modern Vite for webview bundling (fast, efficient builds)
   - TypeScript compilation excludes webview files (handled by Vite)
   - Webview communicates with extension via VS Code API messaging
   - No intermediate editor package - direct integration with editor

### Testing Strategy

- **Test Runner**: Mocha with `.spec.ts` pattern
- **Assertion Library**: Chai
- **Mocking**: Sinon
- **Coverage**: NYC
- **Continuous Testing**: Wallaby.js configuration

### License Structure

- Core runtime: MIT License
- Visual editor: AGPL v3 License

## Development Assumptions

- Always assume dev server are already running