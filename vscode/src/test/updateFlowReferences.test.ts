import * as assert from "assert";
import {
  createRenameMapper,
  updateFlowReferences,
} from "../updateFlowReferences";

const flow = (data: string) => `node:
  instances:
    - id: a
      nodeId: Child
      type: visual
      source:
        type: file
        data: ${data}
`;

suite("updateFlowReferences", () => {
  test("updates references when the imported file moves", () => {
    const mapper = createRenameMapper([
      { oldPath: "/ws/Child.flyde", newPath: "/ws/sub/Child.flyde" },
    ]);
    const res = updateFlowReferences(
      flow("./Child.flyde"),
      "/ws/Parent.flyde",
      "/ws/Parent.flyde",
      mapper
    );
    assert.strictEqual(res, flow("./sub/Child.flyde"));
  });

  test("updates references when the importing file moves", () => {
    const mapper = createRenameMapper([
      { oldPath: "/ws/Parent.flyde", newPath: "/ws/sub/Parent.flyde" },
    ]);
    const res = updateFlowReferences(
      flow("./Child.flyde"),
      "/ws/Parent.flyde",
      "/ws/sub/Parent.flyde",
      mapper
    );
    assert.strictEqual(res, flow("../Child.flyde"));
  });

  test("handles moved folders and leaves unrelated text alone", () => {
    const mapper = createRenameMapper([
      { oldPath: "/ws/lib", newPath: "/ws/other" },
    ]);
    const res = updateFlowReferences(
      flow("./lib/Child.flyde"),
      "/ws/Parent.flyde",
      "/ws/Parent.flyde",
      mapper
    );
    assert.strictEqual(res, flow("./other/Child.flyde"));
    const unchanged = flow("./x.flyde");
    assert.strictEqual(
      updateFlowReferences(unchanged, "/ws/P.flyde", "/ws/P.flyde", mapper),
      unchanged
    );
  });
});
