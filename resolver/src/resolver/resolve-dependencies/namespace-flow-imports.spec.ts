import {
  VisualNode,
  visualNode,
  nodeInstance,
  RefNodeInstance,
  ResolvedFlydeFlow,
  ResolvedFlydeFlowDefinition,
  ResolvedVisualNode,
} from "@flyde/core";
import { assert } from "chai";
import _ = require("lodash");
import { namespaceFlowImports } from "./namespace-flow-imports";

describe("namespace flows", () => {
  it("namespaces referred node ids and their imports", () => {
    const flow: ResolvedFlydeFlowDefinition = {
      main: visualNode({
        id: "Bob",
        instances: [nodeInstance("i1", "Alice")],
      }) as ResolvedVisualNode,
      dependencies: {
        Alice: {
          ...visualNode({
            id: "Alice",
            instances: [nodeInstance("i2", "Dave")],
          }),
          source: {
            path: "bob",
            export: "default",
          },
        },
      },
    };

    const namespaced = namespaceFlowImports(flow, "NS__");

    assert.equal(
      (namespaced.main.instances[0] as RefNodeInstance).nodeId,
      "NS__Alice"
    );

    assert.deepEqual(_.keys(namespaced.dependencies), ["NS__Alice"]);
    assert.equal(namespaced.dependencies["NS__Alice"]?.id, "NS__Alice");

    assert.equal(
      (
        (namespaced.dependencies["NS__Alice"] as unknown as VisualNode)
          .instances[0] as RefNodeInstance
      ).nodeId,
      "NS__Dave"
    );
  });
});
