import { AdvancedCodeNode, CodeNode, codeNodeInstance, dynamicNodeInput, execute, MacroEditorConfigCustom, randomInt } from "@flyde/core";
import { assert } from "chai";
import { readdirSync } from "fs";
import { join } from "path";
import { deserializeFlowByPath } from "../serdes";
import { resolveFlow, resolveFlowByPath } from "./resolveFlow";

import { spiedOutput } from "@flyde/core/dist/test-utils";
import _ = require("lodash");

const getFixturePath = (path: string) => join(__dirname, "../../fixture", path);

describe("resolver", () => {
  it("resolves a blank .flyde file without any instances", () => {
    const data = resolveFlowByPath(getFixturePath("blank.flyde"));

    assert.equal(data.id, "Simple");
    assert.exists(data.instances);
    assert.exists(data.connections);
  });

  it("resolves a .flyde with dependency on an inline code node from another Flyde file ", async () => {
    const data = resolveFlowByPath(
      getFixturePath("a-imports-js-node-from-b/a.flyde")
    );
    const node = data;

    const [s, r] = spiedOutput();
    const n = dynamicNodeInput();
    execute({
      node,
      inputs: { n },
      outputs: { r },
    });

    n.subject.next(2);

    assert.equal(s.lastCall.args[0], 3);
  }).timeout(50);

  it("resolves flows with transitive dependencies", async () => {
    const node = resolveFlowByPath(
      getFixturePath("a-imports-b-imports-c/Container.flyde")
    );

    const [s, r] = spiedOutput();

    const n = dynamicNodeInput();
    execute({
      node,
      inputs: { n },
      outputs: { r },
      onBubbleError: (e) => {
        console.log("error", e);
      },
    });

    n.subject.next(2);

    assert.equal(s.lastCall.args[0], 3);
  });

  describe("namespacing of imports", () => {
    it("resolves flows with 2 levels of transitive dependencies and properly namespaces them", async () => {
      const node = resolveFlowByPath(
        getFixturePath("a-imports-b-imports-c-imports-d/Container.flyde")
      );

      const [s, r] = spiedOutput();
      const n = dynamicNodeInput();
      execute({
        node,

        inputs: { n },
        outputs: { r },
      });

      n.subject.next(2);

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

      const input = dynamicNodeInput();
      const [s1, nplus1] = spiedOutput();
      const [s2, nminus1] = spiedOutput();
      execute({
        node: data,

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

      const [s, r] = spiedOutput();
      const n = dynamicNodeInput();
      execute({
        node: data,

        inputs: { n },
        outputs: { r },
      });

      n.subject.next(2);

      assert.equal(s.lastCall.args[0], 5);
    });
  });

  it("resolves a .flyde with dependency on a code node from a different package", async () => {
    const data = resolveFlowByPath(
      getFixturePath("a-imports-b-code-from-package/a.flyde")
    );
    const [s, r] = spiedOutput();
    const n = dynamicNodeInput();
    execute({
      node: data,
      inputs: { n },
      outputs: { r },
    });
    n.subject.next(2);
    assert.equal(s.lastCall.args[0], 3);
  });

  // TODO: this text is failing in CI, but not locally, investigate
  it.skip("resolves a .flyde with dependency on a visual node from a different package", async () => {
    const data = resolveFlowByPath(
      getFixturePath("a-imports-b-grouped-from-package/a.flyde")
    );
    const [s, r] = spiedOutput();
    const n = dynamicNodeInput();
    execute({
      node: data,
      inputs: { n },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 3);
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
    const node = resolveFlowByPath(path);

    const [s, r] = spiedOutput();
    const n = dynamicNodeInput();
    execute({
      node,
      inputs: { n },
      outputs: { r },
    });

    n.subject.next(2);

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
    resolveFlowByPath(path);

    assert.doesNotThrow(() => { });
  });

  it("imports multiple nodes from the same package", async () => {
    const path = getFixturePath("imports-2-nodes-from-package.flyde");

    const flow = resolveFlowByPath(path);

    const [s, r] = spiedOutput();
    const n = dynamicNodeInput();

    execute({
      node: flow,
      inputs: { n },
      outputs: { r },
      onBubbleError: (e) => {
        console.log("error", e);
      },
    });

    n.subject.next(2);

    assert.equal(s.lastCall.args[0], 2 + 1 + 2);
  });

  it("properly resolves recursions", async () => {
    const path = getFixturePath("recursive.flyde");

    assert.doesNotThrow(() => {
      resolveFlowByPath(path);
    });
  });

  it("resolves dependencies of inline nodes", async () => {
    const flow = resolveFlowByPath(
      getFixturePath("a-uses-inline-node-with-dependency/b-imports-a.flyde")
    );

    const [s, r] = spiedOutput();
    const n = dynamicNodeInput();

    execute({
      node: flow,
      inputs: { n },
      outputs: { r },
    });
    n.subject.next(2);
    assert.equal(s.lastCall.args[0], 2 + 1);
  });

  it("resolves dependencies of imported inline nodes", async () => {
    const flow = resolveFlowByPath(
      getFixturePath("a-uses-inline-node-with-dependency/a.flyde")
    );

    const [s, r] = spiedOutput();
    const n = dynamicNodeInput();
    execute({
      node: flow,
      inputs: { n },
      outputs: { r },
    });

    n.subject.next(2);

    assert.equal(s.lastCall.args[0], 2 + 1);
  });

  it("supports importing files that expose multiple nodes under a single import", async () => {
    const flow = resolveFlowByPath(
      getFixturePath("a-imports-multi-exposed-from-package/a.flyde")
    );

    // assert.exists(resolvedDeps.Add);
    // assert.exists(resolvedDeps.Sub);

    const [s, r] = spiedOutput();

    const n = dynamicNodeInput();
    execute({
      node: flow,
      inputs: { n },
      outputs: { r },
    });

    n.subject.next(5);

    assert.equal(s.lastCall.args[0], 5 + 1 - 1);
  });

  it("resolves flow by content", async () => {
    const path = getFixturePath("a-imports-js-node-from-b/a.flyde");
    const flow = deserializeFlowByPath(
      getFixturePath("a-imports-js-node-from-b/a.flyde")
    );
    const node = resolveFlow(flow.node, path);

    const [s, r] = spiedOutput();
    const n = dynamicNodeInput();
    execute({
      node,
      inputs: { n },
      outputs: { r },
    });

    n.subject.next(2);

    assert.equal(s.lastCall.args[0], 3);
  });

  describe("typescript", () => {
    it("runs code nodes written in TS", async () => {
      const node = resolveFlowByPath(
        getFixturePath("a-imports-ts-node-from-b/a.flyde")
      );

      const [s, r] = spiedOutput();

      const n = dynamicNodeInput();

      execute({
        node,

        inputs: { n },
        outputs: { r },
      });

      n.subject.next(2);

      assert.equal(s.lastCall.args[0], 1);
    });
  });

  it('resolves stdlib nodes from the internal copy of "@flyde/stdlib"', async () => {
    const node = resolveFlowByPath(
      getFixturePath("a-imports-b-code-from-stdlib/flow.flyde")
    );

    const [s, r] = spiedOutput();

    const n = dynamicNodeInput();
    execute({
      node,
      inputs: { n },
      outputs: { r },
      onBubbleError: (e) => {
        console.log("error", e);
      },
    });

    n.subject.next(2);

    assert.equal(s.lastCall.args[0], 4);
  });

  // these were the original macro node tests, might be redundant now
  describe("new code nodes", () => {
    it("resolves a macro node dependency", async () => {
      const node = resolveFlowByPath(
        getFixturePath("macro-node-simple/a.flyde")
      );

      const [s, r] = spiedOutput();

      const n = dynamicNodeInput();

      execute({
        node,
        inputs: { n },
        outputs: { r },
        onBubbleError: (e) => {
          console.log("error", e);
        },
      });

      n.subject.next(2);

      assert.equal(s.lastCall.args[0], 2);
      assert.equal(s.getCalls().length, 3); // duplicate macro duplicates to 3
    });

    it("resolves a transitive macro node dependency", async () => {
      const node = resolveFlowByPath(
        getFixturePath("macro-node-transitive/flow.flyde")
      );

      const [s, r] = spiedOutput();

      const n = dynamicNodeInput();
      let err: any;
      execute({
        node,

        inputs: { n },
        outputs: { r },
        onBubbleError: (e) => {
          throw e;
        },
      });

      n.subject.next(2);
      assert.equal(s.lastCall.args[0], 3);
    });

    it("resolves a macro from external packages", async () => {
      const node = resolveFlowByPath(getFixturePath("macro-node-dep/a.flyde"));

      const [s, r] = spiedOutput();

      const n = dynamicNodeInput();

      execute({
        node,
        inputs: { n },
        outputs: { r },
        onBubbleError: (e) => {
          console.log("error", e);
        },
      });

      n.subject.next(2);

      assert.equal(s.lastCall.args[0], 2);
      assert.equal(s.getCalls().length, 3); // duplicate macro duplicates to 3
    });

    it('resolves stdlib macros from the internal copy of "@flyde/stdlib"', async () => {
      const node = resolveFlowByPath(
        getFixturePath("a-imports-b-macro-from-stdlib/flow.flyde")
      );

      const [s, r] = spiedOutput();

      const n = dynamicNodeInput();

      execute({
        node,
        inputs: { n },
        outputs: { r },
      });
      n.subject.next("");
      assert.equal(s.lastCall.args[0], "Hello");
    });

    it("works with CSV Example from vscode extension", async () => {
      assert.doesNotThrow(() => {
        resolveFlowByPath(getFixturePath("CSVExample.flyde"));
      });
    });

    it("works with Fibonacci Example from vscode extension", async () => {
      resolveFlowByPath(getFixturePath("MemoFibo.flyde"));
      assert.doesNotThrow(() => {
        resolveFlowByPath(getFixturePath("MemoFibo.flyde"));
      });
    });
  });

});
