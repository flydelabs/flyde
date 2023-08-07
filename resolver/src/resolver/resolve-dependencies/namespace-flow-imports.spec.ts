import {
  VisualNode,
  visualPart,
  partInstance,
  RefPartInstance,
  ResolvedFlydeFlow,
  ResolvedFlydeFlowDefinition,
} from "@flyde/core";
import { assert } from "chai";
import _ = require("lodash");
import { namespaceFlowImports } from "./namespace-flow-imports";

describe("namespace flows", () => {
  it("namespaces referred part ids and their imports", () => {
    const flow: ResolvedFlydeFlowDefinition = {
      main: visualPart({
        id: "Bob",
        instances: [partInstance("i1", "Alice")],
      }),
      dependencies: {
        Alice: {
          ...visualPart({
            id: "Alice",
            instances: [partInstance("i2", "Dave")],
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
      (namespaced.main.instances[0] as RefPartInstance).partId,
      "NS__Alice"
    );

    assert.deepEqual(_.keys(namespaced.dependencies), ["NS__Alice"]);
    assert.equal(namespaced.dependencies["NS__Alice"]?.id, "NS__Alice");

    assert.equal(
      (
        (namespaced.dependencies["NS__Alice"] as unknown as VisualNode)
          .instances[0] as RefPartInstance
      ).partId,
      "NS__Dave"
    );
  });
});
