import { expect } from "chai";
import { runFlow } from "./run-flow";
import { join } from "path";
import { mkdirSync, writeFileSync, rmSync } from "fs";

describe("automatic root detection", () => {
  const testDir = join(__dirname, "../test-fixtures-auto-root");
  
  beforeEach(() => {
    // Clean up any existing test directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
    
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("detects root when called from same directory as flow", async () => {
    // Create a simple flow in test directory
    const flowContent = `
node:
  id: SimpleFlow
  inputs:
    n: { mode: required, type: number }
  outputs:
    r: { type: number }
  instances:
    - id: add1
      nodeId: Add
      source: { type: package, data: "@flyde/nodes" }
      config: { n2: { type: value, value: 1 } }
  connections:
    - from: { insId: __this, pinId: n }
      to: { insId: add1, pinId: n1 }
    - from: { insId: add1, pinId: sum }
      to: { insId: __this, pinId: r }
`;
    
    writeFileSync(join(testDir, "simple.flyde"), flowContent);
    
    // Call runFlow from a function in the same directory
    const helperPath = join(testDir, "helper.js");
    writeFileSync(helperPath, `
const { runFlow } = require("${join(__dirname, "run-flow").replace(/\\/g, "/")}");
module.exports = {
  runFlowFromHere: (flowPath, inputs) => runFlow(flowPath, inputs)
};
`);
    
    const helper = require(helperPath);
    const result = await helper.runFlowFromHere("simple.flyde", { n: 5 });
    
    expect(result.r).to.equal(6);
  });

  it("detects root when called from subdirectory", async () => {
    // Create flow in root, call from subdirectory
    const flowContent = `
node:
  id: SimpleFlow
  inputs:
    n: { mode: required, type: number }
  outputs:
    r: { type: number }
  instances:
    - id: add1
      nodeId: Add
      source: { type: package, data: "@flyde/nodes" }
      config: { n2: { type: value, value: 2 } }
  connections:
    - from: { insId: __this, pinId: n }
      to: { insId: add1, pinId: n1 }
    - from: { insId: add1, pinId: sum }
      to: { insId: __this, pinId: r }
`;
    
    writeFileSync(join(testDir, "root.flyde"), flowContent);
    
    const subDir = join(testDir, "sub");
    mkdirSync(subDir);
    
    const helperPath = join(subDir, "helper.js");
    writeFileSync(helperPath, `
const { runFlow } = require("${join(__dirname, "run-flow").replace(/\\/g, "/")}");
module.exports = {
  runFlowFromSubdir: (flowPath, inputs) => runFlow(flowPath, inputs)
};
`);
    
    const helper = require(helperPath);
    const result = await helper.runFlowFromSubdir("../root.flyde", { n: 10 });
    
    expect(result.r).to.equal(12);
  });

  it("detects root using package.json discovery", async () => {
    // Create package.json in root
    writeFileSync(join(testDir, "package.json"), JSON.stringify({
      name: "test-package",
      version: "1.0.0"
    }));
    
    // Create nested directory structure
    const nestedDir = join(testDir, "src", "flows");
    mkdirSync(nestedDir, { recursive: true });
    
    const flowContent = `
node:
  id: SimpleFlow
  inputs:
    n: { mode: required, type: number }
  outputs:
    r: { type: number }
  instances:
    - id: add1
      nodeId: Add
      source: { type: package, data: "@flyde/nodes" }
      config: { n2: { type: value, value: 3 } }
  connections:
    - from: { insId: __this, pinId: n }
      to: { insId: add1, pinId: n1 }
    - from: { insId: add1, pinId: sum }
      to: { insId: __this, pinId: r }
`;
    
    writeFileSync(join(nestedDir, "nested.flyde"), flowContent);
    
    const helperPath = join(nestedDir, "helper.js");
    writeFileSync(helperPath, `
const { runFlow } = require("${join(__dirname, "run-flow").replace(/\\/g, "/")}");
module.exports = {
  runFlowFromNested: (flowPath, inputs) => runFlow(flowPath, inputs)
};
`);
    
    const helper = require(helperPath);
    const result = await helper.runFlowFromNested("nested.flyde", { n: 7 });
    
    expect(result.r).to.equal(10);
  });

  it("falls back to explicit error when detection fails", async () => {
    // Create a scenario where root detection should fail
    const helperPath = join(testDir, "helper.js");
    writeFileSync(helperPath, `
const { runFlow } = require("${join(__dirname, "run-flow").replace(/\\/g, "/")}");
module.exports = {
  runFlowWithBadPath: (flowPath, inputs) => runFlow(flowPath, inputs)
};
`);
    
    delete require.cache[helperPath]; // Clear cache
    const helper = require(helperPath);
    
    try {
      await helper.runFlowWithBadPath("nonexistent.flyde", { n: 1 });
      expect.fail("Expected error to be thrown");
    } catch (error) {
      expect(error.message).to.include("no such file or directory");
    }
  });

  it("works with different call stack depths", async () => {
    const flowContent = `
node:
  id: SimpleFlow
  inputs:
    n: { mode: required, type: number }
  outputs:
    r: { type: number }
  instances:
    - id: add1
      nodeId: Add
      source: { type: package, data: "@flyde/nodes" }
      config: { n2: { type: value, value: 5 } }
  connections:
    - from: { insId: __this, pinId: n }
      to: { insId: add1, pinId: n1 }
    - from: { insId: add1, pinId: sum }
      to: { insId: __this, pinId: r }
`;
    
    writeFileSync(join(testDir, "deep.flyde"), flowContent);
    
    const helperPath = join(testDir, "helper.js");
    writeFileSync(helperPath, `
const { runFlow } = require("${join(__dirname, "run-flow").replace(/\\/g, "/")}");

function level3(flowPath, inputs) {
  return runFlow(flowPath, inputs);
}

function level2(flowPath, inputs) {
  return level3(flowPath, inputs);
}

function level1(flowPath, inputs) {
  return level2(flowPath, inputs);
}

module.exports = { level1 };
`);
    
    delete require.cache[helperPath]; // Clear cache
    const helper = require(helperPath);
    const result = await helper.level1("deep.flyde", { n: 2 });
    
    expect(result.r).to.equal(7);
  });
});