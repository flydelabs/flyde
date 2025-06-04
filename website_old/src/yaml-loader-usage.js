// Example of importing a .flyde file with YAML loader
import helloWorldFlow from "./pages/_hero-example/ExampleHelloWorld.flyde";
// The import above uses the yaml-loader configured in webpack
// It will parse the YAML content of the .flyde file and return it as a JavaScript object

console.log("Loaded Hello World flow:", helloWorldFlow);

// You can use the imported flow directly in your code
export function useImportedFlow() {
  return {
    flow: helloWorldFlow.flow,
    dependencies: helloWorldFlow.dependencies,
  };
}

// When using the yaml-loader with Flyde files, you get the parsed YAML content
// directly as a JavaScript object, so you don't need any additional processing.
