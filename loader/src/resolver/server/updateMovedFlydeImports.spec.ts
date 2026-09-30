import { assert } from "chai";
import { updateFlydeImportsAfterMove } from "./updateMovedFlydeImports";

const parentFlow = `imports: {}
node:
  instances:
    - pos:
        x: 300
        y: 200
      id: nested-instance
      inputConfig: {}
      nodeId: ChildFlow
      config: {}
      type: visual
      source:
        type: file
        data: ./ChildFlow.flyde
    - pos:
        x: 100
        y: 100
      id: stdlib-add
      inputConfig: {}
      nodeId: Add
      config: {}
      type: code
      source:
        type: package
        data: "@flyde/nodes"
  connections: []
  id: ParentFlow
  inputs: {}
  outputs: {}
`;

describe("updateFlydeImportsAfterMove", () => {
  it("updates the import path when an imported .flyde file is moved to another folder", () => {
    const updated = updateFlydeImportsAfterMove(
      parentFlow,
      "/workspace/ParentFlow.flyde",
      "/workspace/ParentFlow.flyde",
      {
        oldPath: "/workspace/ChildFlow.flyde",
        newPath: "/workspace/shared/ChildFlow.flyde",
      }
    );

    assert.isNotNull(updated);
    assert.include(updated!, "data: ./shared/ChildFlow.flyde");
    assert.notInclude(updated!, "data: ./ChildFlow.flyde\n");
  });

  it("re-relativizes imports when the importing flow itself is moved", () => {
    const updated = updateFlydeImportsAfterMove(
      parentFlow,
      "/workspace/ParentFlow.flyde",
      "/workspace/flows/ParentFlow.flyde",
      {
        oldPath: "/workspace/ParentFlow.flyde",
        newPath: "/workspace/flows/ParentFlow.flyde",
      }
    );

    assert.isNotNull(updated);
    assert.include(updated!, "data: ../ChildFlow.flyde");
  });

  it("keeps relative paths stable when a flow and its import are moved together", () => {
    const afterFlowMove = updateFlydeImportsAfterMove(
      parentFlow,
      "/workspace/ParentFlow.flyde",
      "/workspace/sub/ParentFlow.flyde",
      {
        oldPath: "/workspace/ParentFlow.flyde",
        newPath: "/workspace/sub/ParentFlow.flyde",
      }
    );
    assert.isNotNull(afterFlowMove);

    // simulate the extension applying each move of the rename event in turn
    const afterBothMoves = updateFlydeImportsAfterMove(
      afterFlowMove!,
      "/workspace/sub/ParentFlow.flyde",
      "/workspace/sub/ParentFlow.flyde",
      {
        oldPath: "/workspace/ChildFlow.flyde",
        newPath: "/workspace/sub/ChildFlow.flyde",
      }
    );

    assert.isNotNull(afterBothMoves);
    assert.include(afterBothMoves!, "data: ./ChildFlow.flyde");
  });

  it("returns null for moves that do not affect the flow", () => {
    const updated = updateFlydeImportsAfterMove(
      parentFlow,
      "/workspace/ParentFlow.flyde",
      "/workspace/ParentFlow.flyde",
      {
        oldPath: "/workspace/unrelated/Other.flyde",
        newPath: "/workspace/other/Other.flyde",
      }
    );

    assert.isNull(updated);
  });

  it("leaves package and inline sources untouched", () => {
    const updated = updateFlydeImportsAfterMove(
      parentFlow,
      "/workspace/ParentFlow.flyde",
      "/workspace/ParentFlow.flyde",
      {
        oldPath: "/workspace/ChildFlow.flyde",
        newPath: "/workspace/shared/ChildFlow.flyde",
      }
    );

    assert.include(updated!, 'data: "@flyde/nodes"');
  });

  it("updates code node file imports (.flyde.ts) as well", () => {
    const flowWithCodeImport = parentFlow.replace(
      "data: ./ChildFlow.flyde",
      "data: ./Add.flyde.ts"
    );

    const updated = updateFlydeImportsAfterMove(
      flowWithCodeImport,
      "/workspace/ParentFlow.flyde",
      "/workspace/ParentFlow.flyde",
      {
        oldPath: "/workspace/Add.flyde.ts",
        newPath: "/workspace/lib/Add.flyde.ts",
      }
    );

    assert.isNotNull(updated);
    assert.include(updated!, "data: ./lib/Add.flyde.ts");
  });

  it("preserves unrelated formatting and content", () => {
    const updated = updateFlydeImportsAfterMove(
      parentFlow,
      "/workspace/ParentFlow.flyde",
      "/workspace/ParentFlow.flyde",
      {
        oldPath: "/workspace/ChildFlow.flyde",
        newPath: "/workspace/shared/ChildFlow.flyde",
      }
    );

    assert.include(updated!, "id: stdlib-add");
    assert.include(updated!, "x: 300");
  });

  it("returns null for flows that fail to parse", () => {
    const updated = updateFlydeImportsAfterMove(
      "node: [unclosed",
      "/workspace/ParentFlow.flyde",
      "/workspace/ParentFlow.flyde",
      {
        oldPath: "/workspace/ChildFlow.flyde",
        newPath: "/workspace/shared/ChildFlow.flyde",
      }
    );

    assert.isNull(updated);
  });
});
