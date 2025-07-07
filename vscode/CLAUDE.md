# VS Code Extension Development Guide

This guide provides specific guidance for working with the Flyde VS Code extension codebase.

## Project Structure

```
vscode/
├── src/                     # TypeScript source files
│   ├── test/               # Test files
│   │   ├── pageObjects.ts  # Page object functions for tests
│   │   ├── main.test.ts    # Main test suite
│   │   └── testUtils.ts    # Test utilities
│   ├── webview/            # Webview source (built with Vite)
│   └── ...                 # Extension source files
├── out/                    # Compiled JavaScript output
├── webview-dist/           # Built webview assets
├── test-fixtures/          # Test fixture files
└── templates/              # Flow templates
```

## Development Commands

```bash
npm run compile          # Compile TypeScript
npm run build           # Full build (compile + typecheck + webview)
npm run build:webview   # Build webview with Vite
npm run test            # Run all tests
npm run test:visual     # Run visual regression tests
npm run lint            # Run ESLint
```

## Testing Guidelines

### Page Object Model

Use the Page Object Model pattern to keep tests maintainable and avoid repetition.

**Core Principles:**

1. **Page Objects Handle "How"** - Encapsulate UI interactions and element selectors
2. **Tests Handle "What"** - Contain all assertions and test logic
3. **NEVER mix assertions with page objects**

### Page Object Guidelines

**✅ Good Page Objects:**
```typescript
// Returns data for testing
export async function getInstances() {
  const elements = await webviewTestingCommand("$$", { selector: ".ins-view" });
  return elements.map(el => ({ 
    innerHTML: el.innerHTML, 
    textContent: el.textContent 
  }));
}

// Performs UI actions only
export async function runFlow() {
  await webviewTestingCommand("click", { selector: "button.run-btn" });
  await waitForDialog();
  await webviewTestingCommand("clickByText", { text: "Run", tagName: "button" });
}
```

**❌ Bad Page Objects:**
```typescript
// NEVER put assertions in page objects
export async function waitForInstanceCount(expectedCount) {
  const instances = await getInstances();
  assert(instances.length === expectedCount); // NO!
}

// NEVER validate outcomes in page objects  
export async function runFlowAndVerify() {
  await runFlow();
  const events = await getDebuggerEvents();
  assert(events.includes("HelloWorld")); // NO!
}
```

### Test Structure Pattern

```typescript
test("should verify expected behavior", async () => {
  // Arrange - Setup state
  const testFile = buildTestFilePath("HelloWorld.flyde");
  await openFlydeFile(testFile);
  await waitForFlowEditor();
  
  // Act - Perform actions
  await runFlow();
  
  // Assert - Verify outcomes (ONLY in tests)
  const events = await getDebuggerEvents();
  assert(events.some(event => 
    JSON.stringify(event).includes("HelloWorld")
  ));
});
```

### Function Naming Conventions

- **`get*()`** - Returns data for testing
- **`wait*()`** - Waits for elements/conditions
- **`click*()`** - Performs click actions
- **`open*()`** - Opens files/dialogs
- **Avoid**: `check*()`, `verify*()`, `ensure*()` - These suggest assertions

### Page Object Abstraction Levels

Keep abstraction levels meaningful:

1. **Base Operations**: `waitForFlowEditor()` - All tests start with this
2. **Data Retrieval**: `getInstances()` - Returns rich objects with content
3. **Simple Actions**: `clickAddNodesButton()` - Single UI interactions
4. **Complex Flows**: `runFlow()` - Multi-step workflows

**Good Abstraction:**
```typescript
// Test shows clear intent
const instances = await getInstances();
assert(instances.length === 4);           // Test decides what to check
assert(instances[0].innerHTML.includes("Hello")); // Test specifies exact validation
```

**Bad Abstraction:**
```typescript
// Over-specific functions
await waitForInstanceCount(4);           // Forces specific assertion
await waitForNoteNode("Hello comment"); // Too specific, hard to reuse
```

## Webview Development

The extension uses a modern Vite-based webview architecture:

- **Source**: `src/webview/` 
- **Build Output**: `webview-dist/`
- **Development**: `npm run build:webview` rebuilds webview assets
- **Integration**: Webview communicates with extension via VS Code API messaging

## Test Environment

- **Test Runner**: VS Code Extension Test Runner
- **Framework**: Mocha with `.test.ts` pattern
- **Fixtures**: Located in `test-fixtures/`
- **Visual Tests**: Playwright-based visual regression tests

### Running Specific Tests

```bash
# Run specific test by name
node ./out/test/runTest.js --grep "Test flow functionality"

# Run all tests
npm test
```

### Test Setup

Tests automatically:
- Copy test fixtures to temporary directories
- Set up VS Code extension host
- Clean up after each test run

## Common Patterns

### Opening Flyde Files
```typescript
const testFile = buildTestFilePath("HelloWorld.flyde");
await openFlydeFile(testFile);
await waitForFlowEditor();
```

### Testing UI Interactions
```typescript
await clickAddNodesButton();
const menuItems = await getMenuItems();
assert(menuItems.length >= 30);
```

### Testing Flow Execution
```typescript
await runFlow();
const events = await getDebuggerEvents();
assert(events.some(event => /* validation logic */));
```

## Key Files

- **`pageObjects.ts`** - Reusable page object functions
- **`testUtils.ts`** - Core webview testing utilities  
- **`main.test.ts`** - Main test suite
- **`flydeEditor.ts`** - Main extension editor provider

## Best Practices

1. **Always use `waitForFlowEditor()` first** - Base requirement for all flow tests
2. **Use `eventually()` for async operations** - Handles timing issues gracefully
3. **Prefer functions over classes** - Simpler and more maintainable
4. **Keep selectors in page objects** - Never expose CSS selectors to tests
5. **Return meaningful data** - Page objects should return rich objects, not raw DOM
6. **Test intent should be clear** - Reading the test should reveal what's being verified

## Debugging

- **VS Code Extension Host Logs**: Check VS Code Developer Tools console
- **Test Output**: Detailed test execution logs in terminal
- **Webview Debugging**: Use `npm run build:webview` and check browser dev tools