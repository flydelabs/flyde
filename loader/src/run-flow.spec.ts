import { expect } from "chai";
import { runFlow } from "./run-flow";
import { join } from "path";

describe("runFlow", () => {
  it("runs a flow and returns outputs directly", async () => {
    const flowPath = "a.flyde";
    const root = join(__dirname, "../fixture/a-imports-b-visual-local");

    const result = await runFlow(flowPath, { n: 5 }, {
      debuggerUrl: undefined,
      root
    });

    expect(result).to.be.an("object");
    expect(result).to.have.property("r");
    expect(result.r).to.equal(6); // 5 + 1 = 6
  });

  it("uses input values in computation", async () => {
    const flowPath = "a.flyde";
    const root = join(__dirname, "../fixture/a-imports-b-visual-local");

    const result1 = await runFlow(flowPath, { n: 10 }, {
      debuggerUrl: undefined,
      root
    });

    const result2 = await runFlow(flowPath, { n: 100 }, {
      debuggerUrl: undefined,
      root
    });

    expect(result1.r).to.equal(11); // 10 + 1 = 11
    expect(result2.r).to.equal(101); // 100 + 1 = 101
  });

  it("calls onOutputs callback with actual output values", async () => {
    const flowPath = "a.flyde";
    const root = join(__dirname, "../fixture/a-imports-b-visual-local");

    let outputKey: string;
    let outputValue: any;

    const result = await runFlow(flowPath, { n: 42 }, {
      debuggerUrl: undefined,
      root,
      onOutputs: (key, data) => {
        outputKey = key;
        outputValue = data;
      }
    });

    expect(result.r).to.equal(43); // 42 + 1 = 43
    expect(outputKey).to.equal("r");
    expect(outputValue).to.equal(43);
  });

  it("handles errors gracefully", async () => {
    const flowPath = "nonexistent.flyde";
    const root = join(__dirname, "../fixture/a-imports-b-visual-local");

    try {
      await runFlow(flowPath, {}, {
        debuggerUrl: undefined,
        root
      });
      expect.fail("Expected error to be thrown");
    } catch (error) {
      expect(error).to.be.an("error");
    }
  });
});