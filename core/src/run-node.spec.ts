import { expect } from "chai";
import { runNode } from "./run-node";
import { InternalCodeNode } from "./node";

describe("runNode", () => {
  it("runs a simple code node and returns outputs directly", async () => {
    const testNode: InternalCodeNode = {
      id: "TestNode",
      inputs: {
        value: { description: "Input value" }
      },
      outputs: {
        result: { description: "Output result" }
      },
      run: ({ value }, { result }) => {
        result.next(value * 2);
      }
    };

    const result = await runNode(testNode, { value: 5 });
    
    expect(result).to.be.an("object");
    expect(result).to.have.property("result");
    expect(result.result).to.equal(10);
  });

  it("works with multiple inputs and outputs", async () => {
    const testNode: InternalCodeNode = {
      id: "MultiNode",
      inputs: {
        a: { description: "First input" },
        b: { description: "Second input" }
      },
      outputs: {
        sum: { description: "Sum of inputs" },
        product: { description: "Product of inputs" }
      },
      run: ({ a, b }, { sum, product }) => {
        sum.next(a + b);
        product.next(a * b);
      }
    };

    const result = await runNode(testNode, { a: 3, b: 4 });
    
    expect(result).to.be.an("object");
    expect(result).to.have.property("sum");
    expect(result).to.have.property("product");
    expect(result.sum).to.equal(7);
    expect(result.product).to.equal(12);
  });

  it("works with async nodes", async () => {
    const testNode: InternalCodeNode = {
      id: "AsyncNode",
      inputs: {
        value: { description: "Input value" }
      },
      outputs: {
        result: { description: "Output result" }
      },
      run: async ({ value }, { result }) => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));
        result.next(value + " processed");
      }
    };

    const result = await runNode(testNode, { value: "test" });
    
    expect(result).to.be.an("object");
    expect(result).to.have.property("result");
    expect(result.result).to.equal("test processed");
  });

  it("calls onOutputs callback when provided", async () => {
    const testNode: InternalCodeNode = {
      id: "CallbackNode",
      inputs: {
        value: { description: "Input value" }
      },
      outputs: {
        result: { description: "Output result" }
      },
      run: ({ value }, { result }) => {
        result.next(value * 3);
      }
    };

    let callbackCalled = false;
    let callbackKey: string;
    let callbackData: any;

    const result = await runNode(testNode, { value: 7 }, {
      onOutputs: (key, data) => {
        callbackCalled = true;
        callbackKey = key;
        callbackData = data;
      }
    });
    
    expect(result).to.be.an("object");
    expect(result.result).to.equal(21);
    expect(callbackCalled).to.be.true;
    expect(callbackKey).to.equal("result");
    expect(callbackData).to.equal(21);
  });

  it("handles errors gracefully", async () => {
    const errorNode: InternalCodeNode = {
      id: "ErrorNode",
      inputs: {
        value: { description: "Input value" }
      },
      outputs: {
        result: { description: "Output result" }
      },
      run: () => {
        throw new Error("Test error");
      }
    };

    try {
      await runNode(errorNode, { value: "test" });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).to.be.an("error");
      expect(error.message).to.include("Test error");
    }
  });
});