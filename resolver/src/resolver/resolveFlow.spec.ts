import {
  CodeNode,
  dynamicNodeInput,
  execute,
  ImportedNode,
  InlineNodeInstance,
  NodesCollection,
  randomInt,
  RefNodeInstance,
  staticNodeInput,
  VisualNode,
} from "@flyde/core";
import { assert } from "chai";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { deserializeFlow, deserializeFlowByPath } from "../serdes";
import { resolveFlowByPath, resolveFlowDependencies } from "./resolve-flow";

import { spiedOutput } from "@flyde/core/dist/test-utils";
import _ = require("lodash");

const getFixturePath = (path: string) => join(__dirname, "../../fixture", path);

describe("resolver", () => {
  it("resolves a simple .flyde file without any dependencies", () => {
    const data = resolveFlowByPath(getFixturePath("simple.flyde"));

    assert.equal(data.main.id, "Simple");
    assert.exists(data.main.instances);
    assert.exists(data.main.connections);
  });

  it("resolves a .flyde with dependency on an inline code node from another Flyde file ", async () => {
    const data = resolveFlowByPath(
      getFixturePath("a-imports-js-node-from-b/a.flyde")
    );
    const node = data.main;

    const resolvedDeps = data.dependencies as NodesCollection;

    const [s, r] = spiedOutput();
    execute({
      node,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticNodeInput(2) },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 3);
  }).timeout(50);

  it("resolves flows with transitive dependencies", async () => {
    const data = resolveFlowByPath(
      getFixturePath("a-imports-b-imports-c/Container.flyde")
    );

    const node = data.main;
    const resolvedDeps = data.dependencies as NodesCollection;

    const [s, r] = spiedOutput();
    execute({
      node,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticNodeInput(2) },
      outputs: { r },
    });

    // const val = await simplifiedExecute(data.main, resolvedDeps, { n: 2 });

    assert.equal(s.lastCall.args[0], 3);
  });

  describe("namespacing of imports", () => {
    it("resolves flows with 2 levels of transitive dependencies and properly namespaces them", async () => {
      const data = resolveFlowByPath(
        getFixturePath("a-imports-b-imports-c-imports-d/Container.flyde")
      );

      const resolvedDeps = data.dependencies as NodesCollection;

      const keys = _.keys(resolvedDeps);

      assert.deepEqual(keys, [
        "Add1WrapperTwice__Add1Wrapper__Add1",
        "Add1WrapperTwice__Add1Wrapper",
        "Add1WrapperTwice",
        "Container",
      ]);

      const [s, r] = spiedOutput();
      execute({
        node: data.main,
        resolvedDeps: resolvedDeps,
        inputs: { n: staticNodeInput(2) },
        outputs: { r },
      });

      assert.equal(s.lastCall.args[0], 3);
    });

    it("avoids clashes in imports by namespacing imports", async () => {
      /*
         node Container will import 2 nodes, each importing a node 
         named "Special" but with a different content (one does +1, the other does -1)
      */
      const data = resolveFlowByPath(
        getFixturePath("a-imports-b-and-c-potential-ambiguity/Container.flyde")
      );
      const resolvedDeps = data.dependencies as NodesCollection;

      assert.deepEqual(_.keys(resolvedDeps), [
        "Adds1Wrapper__Special",
        "Adds1Wrapper",
        "Subs1Wrapper__Special",
        "Subs1Wrapper",
        "Container",
      ]);

      const input = dynamicNodeInput();
      const [s1, nplus1] = spiedOutput();
      const [s2, nminus1] = spiedOutput();
      execute({
        node: data.main,
        resolvedDeps: resolvedDeps,
        inputs: {
          n: input,
        },
        outputs: {
          nplus1,
          nminus1,
        },
      });
      const n = randomInt(42);
      input.subject.next(n);

      assert.equal(s1.lastCall.args[0], n + 1);
      assert.equal(s2.lastCall.args[0], n - 1);
    });

    it("namespaces instances in inline nodes as well", () => {
      const data = resolveFlowByPath(
        getFixturePath(
          "namespaces-imported-inline-visual-node-references/Flow.flyde"
        )
      );

      const resolvedDeps = data.dependencies as NodesCollection;

      const [s, r] = spiedOutput();
      execute({
        node: data.main,
        resolvedDeps: resolvedDeps,
        inputs: { n: staticNodeInput(2) },
        outputs: { r },
      });

      assert.equal(s.lastCall.args[0], 5);

      const keys = _.keys(resolvedDeps);
      console.log(keys);

      assert.deepEqual(keys, [
        "Container__Special",
        "Container",
        "Special",
        "Flow",
      ]);

      const resolvedContainer = resolvedDeps["Container"] as VisualNode;
      const inlineContainer = (
        resolvedContainer.instances[0] as InlineNodeInstance
      ).node as VisualNode;
      console.log("inlineContainer", inlineContainer);

      assert.equal(
        (inlineContainer.instances[0] as RefNodeInstance).nodeId,
        "Container__Special"
      );
    });
  });

  it("resolves a .flyde with dependency on a code node from a different package", async () => {
    const data = resolveFlowByPath(
      getFixturePath("a-imports-b-code-from-package/a.flyde"),
      "implementation"
    );

    const resolvedDeps = data.dependencies as NodesCollection;
    const [s, r] = spiedOutput();
    execute({
      node: data.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticNodeInput(2) },
      outputs: { r },
    });
    assert.equal(s.lastCall.args[0], 3);
    assert.match(
      data.dependencies.Add1?.source.path ?? "",
      /@acme\/add1\/src\/add1\.flyde\.js$/
    );

    assert.equal(data.dependencies.Add1?.source.export ?? "", "default");
  });

  // TODO: this text is failing in CI, but not locally, investigate
  it.skip("resolves a .flyde with dependency on a visual node from a different package", async () => {
    const data = resolveFlowByPath(
      getFixturePath("a-imports-b-grouped-from-package/a.flyde"),
      "implementation"
    );

    const resolvedDeps = data.dependencies as NodesCollection;
    const [s, r] = spiedOutput();
    execute({
      node: data.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticNodeInput(2) },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 3);

    assert.match(
      data.dependencies.Add1Wrapped?.source.path ?? "",
      /@acme\/add1-wrapped\/src\/add1-wrapped\.flyde$/
    );
  });

  it("breaks on invalid schemas", () => {
    const invalidsRoot = getFixturePath("schema-validation/invalid");
    const invalids = readdirSync(invalidsRoot);
    for (const invalid of invalids) {
      if (!invalid.endsWith(".flyde")) {
        break;
      }
      const path = join(invalidsRoot, invalid);

      assert.throws(
        () => {
          deserializeFlowByPath(path);
        },
        /Error parsing/,
        `File ${invalid} should have failed schema validation`
      );
    }
  });

  it("allows importing simple code based nodes that require packages", async () => {
    const path = getFixturePath("a-imports-js-node-from-b-with-dep/a.flyde");
    const flow = resolveFlowByPath(path);

    const resolvedDeps = flow.dependencies as NodesCollection;

    const [s, r] = spiedOutput();
    execute({
      node: flow.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticNodeInput(2) },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 2 + 1);
  });

  it("throws error when importing node that has a missing dep transitively", async () => {
    const path = getFixturePath("a-imports-b-with-missing-deps/a.flyde");
    assert.throws(() => {
      resolveFlowByPath(path);
    }, /SpreadList3/);
  });

  it("throws error when importing node that has a missing dep directly", async () => {
    // has a missing depen
    const path = getFixturePath(
      "a-imports-b-with-missing-deps/SpreadList3.flyde"
    );
    assert.throws(() => {
      resolveFlowByPath(path);
    }, /GetListItem/);
  });

  it("only resolves imported nodes, aka does not break if a package exports a broken node that is not imported", () => {
    const path = getFixturePath(
      "imports-ok-from-package-with-problematic.flyde"
    );

    const flow = resolveFlowByPath(path);
    assert.exists(flow.dependencies.Ok);
    assert.notExists(flow.dependencies.Problematic);
  });

  it("imports multiple nodes from the same package", async () => {
    const path = getFixturePath("imports-2-nodes-from-package.flyde");

    const flow = resolveFlowByPath(path);
    const resolvedDeps = flow.dependencies as NodesCollection;

    const [s, r] = spiedOutput();
    execute({
      node: flow.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticNodeInput(2) },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 2 + 1 + 2);
  }).timeout(20);

  it("properly resolves recursions", async () => {
    const path = getFixturePath("recursive.flyde");

    assert.doesNotThrow(() => {
      resolveFlowByPath(path);
    });
  }).timeout(20);

  it("resolves dependencies of inline nodes", async () => {
    const flow = resolveFlowByPath(
      getFixturePath("a-uses-inline-node-with-dependency/a.flyde")
    );

    const resolvedDeps = flow.dependencies as NodesCollection;

    assert.exists(resolvedDeps.Add);
    // const val = await simplifiedExecute(flow.main, resolvedDeps, { n: 2 });

    const [s, r] = spiedOutput();
    execute({
      node: flow.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticNodeInput(2) },
      outputs: { r },
    });
    assert.equal(s.lastCall.args[0], 2 + 1);
  });

  it("resolves dependencies of imported inline nodes", async () => {
    const flow = resolveFlowByPath(
      getFixturePath("a-uses-inline-node-with-dependency/b-imports-a.flyde")
    );

    const resolvedDeps = flow.dependencies as NodesCollection;

    assert.exists(resolvedDeps.Add1Wrapper);

    const [s, r] = spiedOutput();
    execute({
      node: flow.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticNodeInput(2) },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 2 + 1);
  });

  it("supports importing files that expose multiple nodes under a single import", async () => {
    const flow = resolveFlowByPath(
      getFixturePath("a-imports-multi-exposed-from-package/a.flyde")
    );

    const resolvedDeps = flow.dependencies as NodesCollection;

    assert.exists((resolvedDeps.Add as CodeNode).run);
    assert.exists((resolvedDeps.Sub as CodeNode).run);

    assert.match(
      (resolvedDeps.Add as unknown as ImportedNode).source.export,
      /add/
    );
    assert.match(
      (resolvedDeps.Sub as unknown as ImportedNode).source.export,
      /sub/
    );

    const [s, r] = spiedOutput();
    execute({
      node: flow.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticNodeInput(5) },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 5 + 1 - 2);
  });

  it("resolves flow by content", async () => {
    const path = getFixturePath("a-imports-js-node-from-b/a.flyde");
    const flow = deserializeFlowByPath(
      getFixturePath("a-imports-js-node-from-b/a.flyde")
    );
    const resolvedFlow = resolveFlowDependencies(flow, path);
    const node = resolvedFlow.main;

    const resolvedDeps = resolvedFlow.dependencies as NodesCollection;

    const [s, r] = spiedOutput();
    execute({
      node,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticNodeInput(2) },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 3);
  });

  describe("typescript", () => {
    it("runs code nodes written in TS", async () => {
      const data = resolveFlowByPath(
        getFixturePath("a-imports-ts-node-from-b/a.flyde")
      );
      const node = data.main;

      const resolvedDeps = data.dependencies as NodesCollection;

      const [s, r] = spiedOutput();

      execute({
        node,
        resolvedDeps: resolvedDeps,
        inputs: { n: staticNodeInput(2) },
        outputs: { r },
      });

      assert.equal(s.lastCall.args[0], 1);
    });
  });

  it('resolves stdlib nodes from the internal copy of "@flyde/stdlib"', async () => {
    const data = resolveFlowByPath(
      getFixturePath("a-imports-b-code-from-stdlib/flow.flyde")
    );

    const resolvedDeps = data.dependencies as NodesCollection;

    const [s, r] = spiedOutput();
    execute({
      node: data.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticNodeInput(2) },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 3);
  });

  describe("macro nodes", () => {
    it("resolves a macro node dependency", async () => {
      const data = resolveFlowByPath(
        getFixturePath("macro-node-simple/a.flyde")
      );
      const node = data.main;
      const resolvedDeps = data.dependencies as NodesCollection;

      const [s, r] = spiedOutput();

      execute({
        node,
        resolvedDeps: resolvedDeps,
        inputs: { n: staticNodeInput(2) },
        outputs: { r },
      });

      assert.equal(s.lastCall.args[0], 2);
      assert.equal(s.getCalls().length, 3); // duplicate macro duplicates to 3
    });

    it("resolves a transitive macro node dependency", async () => {
      const data = resolveFlowByPath(
        getFixturePath("macro-node-transitive/flow.flyde")
      );
      const node = data.main;
      const resolvedDeps = data.dependencies as NodesCollection;

      const [s, r] = spiedOutput();

      execute({
        node,
        resolvedDeps: resolvedDeps,
        inputs: { n: staticNodeInput(2) },
        outputs: { r },
      });

      assert.equal(s.lastCall.args[0], 3);
    });

    it("resolves a macro from external packages", async () => {
      const data = resolveFlowByPath(getFixturePath("macro-node-dep/a.flyde"));
      const node = data.main;
      const resolvedDeps = data.dependencies as NodesCollection;

      const [s, r] = spiedOutput();

      execute({
        node,
        resolvedDeps: resolvedDeps,
        inputs: { n: staticNodeInput(2) },
        outputs: { r },
      });

      assert.equal(s.lastCall.args[0], 2);
      assert.equal(s.getCalls().length, 3); // duplicate macro duplicates to 3
    });
  });
});
