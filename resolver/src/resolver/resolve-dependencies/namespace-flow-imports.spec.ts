import {
  VisualNode,
  visualNode,
  RefNodeInstance,
  internalNodeInstance,
  InternalVisualNode,
  ResolvedFlydeRuntimeFlow,
  InternalCodeNode,
  InternalRefNodeInstance,
} from "@flyde/core";
import { assert } from "chai";
import _ = require("lodash");
import { namespaceFlowImports } from "./namespace-flow-imports";

describe("namespace flows", () => {
  it("namespaces referred node ids and their imports", () => {
    const flow = {
      main: {
        id: "Bob",
        instances: [internalNodeInstance("i1", "Alice")],
        connections: [],
        inputs: {},
        outputs: {},
      },
      dependencies: {
        Alice: {
          id: "Alice",
          instances: [internalNodeInstance("i2", "Dave")],
          connections: [],
          inputs: {},
          outputs: {},
        } as InternalVisualNode,
      },
    } as ResolvedFlydeRuntimeFlow;

    const namespaced = namespaceFlowImports(flow, "NS__");

    assert.equal(
      (namespaced.main.instances[0] as InternalRefNodeInstance).nodeId,
      "NS__Alice"
    );

    assert.deepEqual(_.keys(namespaced.dependencies), ["NS__Alice"]);
    assert.equal(namespaced.dependencies["NS__Alice"]?.id, "NS__Alice");

    assert.equal(
      (
        (namespaced.dependencies["NS__Alice"] as unknown as VisualNode)
          .instances[0] as InternalRefNodeInstance
      ).nodeId,
      "NS__Dave"
    );
  });
});
