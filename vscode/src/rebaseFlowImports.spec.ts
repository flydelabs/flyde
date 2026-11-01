import * as assert from "assert";
import * as path from "path";
import { suite as describe, test as it } from "mocha";
import type { FlydeFlow } from "@flyde/core";
import { rebaseFlowImports } from "./rebaseFlowImports";

const root = path.resolve("move-test");
const file = (relative: string) => path.join(root, relative);
const flow = (source: string, type = "file") =>
  ({
    node: { instances: [{ source: { type, data: source } }] },
  }) as unknown as FlydeFlow;
const data = (value: FlydeFlow | undefined) => {
  const source = value?.node.instances[0].source;
  return source && "data" in source ? source.data : undefined;
};

describe("rebaseFlowImports", () => {
  (process.platform === "win32" ? it : it.skip)(
    "uses an absolute import when the target moves to another drive",
    () => {
      const drive =
        path.parse(root).root.toUpperCase() === "Z:\\" ? "Y:\\" : "Z:\\";
      const target = path.join(drive, "flows", "child.flyde");
      const result = rebaseFlowImports(
        flow("./child.flyde"),
        file("main.flyde"),
        [{ oldPath: file("child.flyde"), newPath: target }],
      );
      assert.strictEqual(data(result), target);
    },
  );

  it("uses original paths for simultaneous swaps without cascading", () => {
    const result = rebaseFlowImports(flow("./a.flyde"), file("main.flyde"), [
      { oldPath: file("a.flyde"), newPath: file("b.flyde") },
      { oldPath: file("b.flyde"), newPath: file("a.flyde") },
    ]);
    assert.strictEqual(data(result), "./b.flyde");
  });

  it("relocates the importer and dependency independently in a batch", () => {
    const result = rebaseFlowImports(
      flow("./child.flyde"),
      file("main.flyde"),
      [
        { oldPath: file("main.flyde"), newPath: file("flows/main.flyde") },
        { oldPath: file("child.flyde"), newPath: file("lib/child.flyde") },
      ],
    );
    assert.strictEqual(data(result), "../lib/child.flyde");
  });

  it("prefers the most specific move over a containing folder move", () => {
    const result = rebaseFlowImports(
      flow("./lib/child.flyde"),
      file("main.flyde"),
      [
        { oldPath: file("lib"), newPath: file("renamed") },
        {
          oldPath: file("lib/child.flyde"),
          newPath: file("elsewhere/child.flyde"),
        },
      ],
    );
    assert.strictEqual(data(result), "./elsewhere/child.flyde");
  });

  it("preserves absolute imports when only the importer moves", () => {
    const result = rebaseFlowImports(
      flow(file("child.flyde")),
      file("main.flyde"),
      [{ oldPath: file("main.flyde"), newPath: file("nested/main.flyde") }],
    );
    assert.strictEqual(result, undefined);
  });

  it("reproduces and repairs an imported file moving to a new folder", () => {
    const original = flow("./child.flyde");
    const result = rebaseFlowImports(original, file("main.flyde"), [
      { oldPath: file("child.flyde"), newPath: file("nested/child.flyde") },
    ]);
    assert.strictEqual(data(result), "./nested/child.flyde");
    assert.strictEqual(data(original), "./child.flyde");
  });

  it("rebases imports when the importing flow itself moves", () => {
    const result = rebaseFlowImports(
      flow("./child.flyde"),
      file("main.flyde"),
      [{ oldPath: file("main.flyde"), newPath: file("nested/main.flyde") }],
    );
    assert.strictEqual(data(result), "../child.flyde");
  });

  it("leaves imports unchanged when their entire containing folder moves", () => {
    const result = rebaseFlowImports(
      flow("./child.flyde"),
      file("flows/main.flyde"),
      [{ oldPath: file("flows"), newPath: file("renamed") }],
    );
    assert.strictEqual(result, undefined);
  });

  it("does not rewrite package imports or siblings with a matching path prefix", () => {
    assert.strictEqual(
      rebaseFlowImports(flow("@flyde/nodes", "package"), file("main.flyde"), [
        { oldPath: file("main.flyde"), newPath: file("nested/main.flyde") },
      ]),
      undefined,
    );
    assert.strictEqual(
      rebaseFlowImports(
        flow("./folder-extra/child.flyde"),
        file("main.flyde"),
        [{ oldPath: file("folder"), newPath: file("renamed") }],
      ),
      undefined,
    );
  });

  it("updates file sources inside inline visual nodes", () => {
    const original = {
      node: {
        instances: [
          { source: { type: "inline", data: flow("./child.flyde").node } },
        ],
      },
    } as unknown as FlydeFlow;
    const result = rebaseFlowImports(original, file("main.flyde"), [
      { oldPath: file("child.flyde"), newPath: file("renamed.flyde") },
    ]);
    const nested = data(result) as {
      instances: { source: { data: string } }[];
    };
    assert.strictEqual(nested.instances[0].source.data, "./renamed.flyde");
  });
});
