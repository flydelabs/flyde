module.exports = {
  id: "Node",
  displayName: "Custom Editor Node",
  description: "A node with custom editor component",
  inputs: {
    n: {
      id: "n",
      displayName: "Input",
      description: "Input value",
      type: "number"
    }
  },
  outputs: {
    r: {
      id: "r",
      displayName: "Result",
      description: "Result value (input + 1)",
      type: "number"
    }
  },
  run: ({ inputs, outputs }) => {
    inputs.n.subscribe(n => {
      outputs.r.next(n + 1);
    });
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "./comp.js"
  }
} 