import {
  CodeNode,
  dynamicPartInput,
  execute,
  ImportedNode,
  NodesCollection,
  randomInt,
  staticPartInput,
  values,
} from "@flyde/core";
import { assert } from "chai";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { deserializeFlow, deserializeFlowByPath } from "../serdes";
import {
  resolveFlowDependenciesByPath,
  resolveFlowDependencies,
} from "./resolve-flow";

import { spiedOutput } from "@flyde/core/dist/test-utils";
import _ = require("lodash");

const getFixturePath = (path: string) => join(__dirname, "../../fixture", path);

describe("resolver", () => {
  beforeEach(() => {
    (global as any).vm2 = require("vm2");
  });

  it("resolves a simple .flyde file without any dependencies", () => {
    const data = resolveFlowDependenciesByPath(getFixturePath("simple.flyde"));

    assert.equal(data.main.id, "Simple");
    assert.exists(data.main.instances);
    assert.exists(data.main.connections);
  });

  it("resolves a .flyde with dependency on an inline code part from another Flyde file ", async () => {
    const data = resolveFlowDependenciesByPath(
      getFixturePath("a-imports-js-part-from-b/a.flyde")
    );
    const part = data.main;

    const resolvedDeps = data.dependencies as NodesCollection;

    const [s, r] = spiedOutput();
    execute({
      part,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticPartInput(2) },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 3);
  }).timeout(50);

  it("resolves flows with transitive dependencies", async () => {
    const data = resolveFlowDependenciesByPath(
      getFixturePath("a-imports-b-imports-c/Container.flyde")
    );

    const part = data.main;
    const resolvedDeps = data.dependencies as NodesCollection;

    const [s, r] = spiedOutput();
    execute({
      part,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticPartInput(2) },
      outputs: { r },
    });

    // const val = await simplifiedExecute(data.main, resolvedDeps, { n: 2 });

    assert.equal(s.lastCall.args[0], 3);
  });

  it("resolves flows with 2 levels of transitive dependencies and properly namespaces them", async () => {
    const data = resolveFlowDependenciesByPath(
      getFixturePath("a-imports-b-imports-c-imports-d/Container.flyde")
    );

    const resolvedDeps = data.dependencies as NodesCollection;

    const keys = _.keys(resolvedDeps);

    assert.deepEqual(keys, [
      "Add1WrapperTwice__Add1Wrapper__Add1",
      "Add1WrapperTwice__Add1Wrapper",
      "Add1WrapperTwice",
    ]);

    const [s, r] = spiedOutput();
    execute({
      part: data.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticPartInput(2) },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 3);
  });

  it("avoids clashes in imports by namespacing imports", async () => {
    /*
       part Container will import 2 parts, each importing a part 
       named "Special" but with a different content (one does +1, the other does -1)
    */
    const data = resolveFlowDependenciesByPath(
      getFixturePath("a-imports-b-and-c-potential-ambiguity/Container.flyde")
    );
    const resolvedDeps = data.dependencies as NodesCollection;

    assert.deepEqual(_.keys(resolvedDeps), [
      "Adds1Wrapper__Special",
      "Adds1Wrapper",
      "Subs1Wrapper__Special",
      "Subs1Wrapper",
    ]);

    const input = dynamicPartInput();
    const [s1, nplus1] = spiedOutput();
    const [s2, nminus1] = spiedOutput();
    execute({
      part: data.main,
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

  it("resolves a .flyde with dependency on a code part from a different package", async () => {
    const data = resolveFlowDependenciesByPath(
      getFixturePath("a-imports-b-code-from-package/a.flyde"),
      "implementation"
    );

    const resolvedDeps = data.dependencies as NodesCollection;
    const [s, r] = spiedOutput();
    execute({
      part: data.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticPartInput(2) },
      outputs: { r },
    });
    assert.equal(s.lastCall.args[0], 3);
    assert.match(
      data.dependencies.Add1?.source.path ?? "",
      /@acme\/add1\/src\/add1\.flyde\.js$/
    );

    assert.equal(data.dependencies.Add1?.source.export ?? "", "default");
  });

  it("resolves a .flyde with dependency on a visual part from a different package", async () => {
    const data = resolveFlowDependenciesByPath(
      getFixturePath("a-imports-b-grouped-from-package/a.flyde"),
      "implementation"
    );

    const resolvedDeps = data.dependencies as NodesCollection;
    const [s, r] = spiedOutput();
    execute({
      part: data.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticPartInput(2) },
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

  it("allows importing simple code based parts that require packages", async () => {
    const path = getFixturePath("a-imports-js-part-from-b-with-dep/a.flyde");
    const flow = resolveFlowDependenciesByPath(path);

    const resolvedDeps = flow.dependencies as NodesCollection;

    const [s, r] = spiedOutput();
    execute({
      part: flow.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticPartInput(2) },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 2 + 1);
  });

  it("throws error when importing part that has a missing dep transitively", async () => {
    const path = getFixturePath("a-imports-b-with-missing-deps/a.flyde");
    assert.throws(() => {
      resolveFlowDependenciesByPath(path);
    }, /not imported/);
  });

  it("throws error when importing part that has a missing dep directly", async () => {
    // has a missing depen
    const path = getFixturePath(
      "a-imports-b-with-missing-deps/SpreadList3.flyde"
    );
    assert.throws(() => {
      resolveFlowDependenciesByPath(path);
    }, /GetListItem/);
  });

  it("only resolves imported parts, aka does not break if a package exports a broken part that is not imported", () => {
    const path = getFixturePath(
      "imports-ok-from-package-with-problematic.flyde"
    );

    const flow = resolveFlowDependenciesByPath(path);
    assert.exists(flow.dependencies.Ok);
    assert.notExists(flow.dependencies.Problematic);
  });

  it("imports multiple parts from the same package", async () => {
    const path = getFixturePath("imports-2-parts-from-package.flyde");

    const flow = resolveFlowDependenciesByPath(path);
    const resolvedDeps = flow.dependencies as NodesCollection;

    const [s, r] = spiedOutput();
    execute({
      part: flow.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticPartInput(2) },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 2 + 1 + 2);
  }).timeout(20);

  it("properly resolves recursions", async () => {
    const path = getFixturePath("recursive.flyde");

    assert.doesNotThrow(() => {
      resolveFlowDependenciesByPath(path);
    });
  }).timeout(20);

  it("resolves dependencies of inline parts", async () => {
    const flow = resolveFlowDependenciesByPath(
      getFixturePath("a-uses-inline-part-with-dependency/a.flyde")
    );

    const resolvedDeps = flow.dependencies as NodesCollection;

    assert.exists(resolvedDeps.Add);
    // const val = await simplifiedExecute(flow.main, resolvedDeps, { n: 2 });

    const [s, r] = spiedOutput();
    execute({
      part: flow.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticPartInput(2) },
      outputs: { r },
    });
    assert.equal(s.lastCall.args[0], 2 + 1);
  });

  it("resolves dependencies of imported inline parts", async () => {
    const flow = resolveFlowDependenciesByPath(
      getFixturePath("a-uses-inline-part-with-dependency/b-imports-a.flyde")
    );

    const resolvedDeps = flow.dependencies as NodesCollection;

    assert.exists(resolvedDeps.Add1Wrapper);

    const [s, r] = spiedOutput();
    execute({
      part: flow.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticPartInput(2) },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 2 + 1);
  });

  it("supports importing files that expose multiple parts under a single import", async () => {
    const flow = resolveFlowDependenciesByPath(
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
      part: flow.main,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticPartInput(5) },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 5 + 1 - 2);
  });

  it("resolves flow by content", async () => {
    const path = getFixturePath("a-imports-js-part-from-b/a.flyde");
    const flow = deserializeFlowByPath(
      getFixturePath("a-imports-js-part-from-b/a.flyde")
    );
    const resolvedFlow = resolveFlowDependencies(flow, path);
    const part = resolvedFlow.main;

    const resolvedDeps = resolvedFlow.dependencies as NodesCollection;

    const [s, r] = spiedOutput();
    execute({
      part,
      resolvedDeps: resolvedDeps,
      inputs: { n: staticPartInput(2) },
      outputs: { r },
    });

    assert.equal(s.lastCall.args[0], 3);
  });

  describe("typescript", () => {
    it("runs code parts written in TS", async () => {
      const data = resolveFlowDependenciesByPath(
        getFixturePath("a-imports-ts-part-from-b/a.flyde")
      );
      const part = data.main;

      const resolvedDeps = data.dependencies as NodesCollection;

      const [s, r] = spiedOutput();

      execute({
        part,
        resolvedDeps: resolvedDeps,
        inputs: { n: staticPartInput(2) },
        outputs: { r },
      });

      assert.equal(s.lastCall.args[0], 1);
    });
  });
});
