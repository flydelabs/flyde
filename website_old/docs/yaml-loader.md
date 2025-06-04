# YAML Loader for .flyde Files

Flyde files are YAML files that represent Flyde flows. Using a YAML loader, you can easily parse and use the contents of these files in your JavaScript code.

## Installation

We've added the yaml-loader package to parse .flyde files:

```bash
pnpm add -D yaml-loader
```

## Configuration

The webpack configuration has been updated to use yaml-loader for .flyde files:

```js
{
  test: /\.flyde$/,
  use: [
    {
      loader: "@flyde/runtime/webpack-loader",
      options: {
        /* ... */
      },
    },
    // Added yaml-loader to parse .flyde files as YAML
    {
      loader: "yaml-loader"
    }
  ],
}
```

## Usage

Once configured, you can import .flyde files directly in your JavaScript code:

```js
// Import the flow directly
import myFlow from "./path/to/flow.flyde";

// Use the imported flow
console.log(myFlow.flow);
console.log(myFlow.dependencies);
```

The imported file will be a JavaScript object with the parsed YAML content.

## Raw YAML Access

If you need to access or manipulate the raw YAML content, you can use the js-yaml package:

```js
import fs from "fs";
import { load } from "js-yaml";

// Load raw YAML
const yamlContent = fs.readFileSync("./path/to/flow.flyde", "utf8");
const parsedYaml = load(yamlContent);
```

## Example

```js
// Example of importing a .flyde file with YAML loader
import helloWorldFlow from "./pages/_hero-example/ExampleHelloWorld.flyde";

// You can use the imported flow directly
export function useImportedFlow() {
  return {
    flow: helloWorldFlow.flow,
    dependencies: helloWorldFlow.dependencies,
  };
}
```
