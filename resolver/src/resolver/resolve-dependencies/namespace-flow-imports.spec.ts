import {
  VisualNode,
  visualNode,
  nodeInstance,
  RefNodeInstance,
  ResolvedFlydeFlowDefinition,
} from "@flyde/core";
import { assert } from "chai";
import _ = require("lodash");
import { namespaceFlowImports } from "./namespace-flow-imports";
import { ResolvedVisualNode } from "@flyde/core";

describe("namespace flows", () => {
  it("namespaces referred node ids and their imports", () => {
    const flow: ResolvedFlydeFlowDefinition = {
      main: visualNode({
        id: "Bob",
        instances: [nodeInstance("i1", "Alice")],
      }) as VisualNode,
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

  it("namespaces macroId for macro instances", () => {
    const flow: ResolvedFlydeFlowDefinition = {
      main: visualNode({
        id: "MainFlow",
        instances: [
          {
            id: "i1",
            macroId: "SomeMacro",
            macroData: { count: 3 },
            inputConfig: {},
            pos: { x: 0, y: 0 },
          } as RefNodeInstance,
        ],
      }) as ResolvedVisualNode,
      dependencies: {
        SomeMacro: {
          id: "SomeMacro",
          source: {
            path: "@macro/package",
            export: "SomeMacro",
          },
          inputs: {},
          outputs: {},
        },
      },
    };

    const namespaced = namespaceFlowImports(flow, "NS__");

    // Verify that macroId is also namespaced
    assert.equal(
      (namespaced.main.instances[0] as RefNodeInstance).macroId,
      "NS__SomeMacro"
    );

    assert.deepEqual(_.keys(namespaced.dependencies), ["NS__SomeMacro"]);
    assert.equal(namespaced.dependencies["NS__SomeMacro"]?.id, "NS__SomeMacro");
  });
});
