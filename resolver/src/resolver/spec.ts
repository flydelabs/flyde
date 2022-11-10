import {
  dynamicPartInput,
  execute,
  ImportedPart,
  PartRepo,
  PreBundleNativePart,
  randomInt,
  simplifiedExecute,
  values,
} from "@flyde/core";
import { assert } from "chai";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { deserializeFlow } from "../serdes";
import { resolveFlow } from "./resolve-flow";

import { spiedOutput } from "@flyde/core/dist/test-utils";
import _ = require("lodash");

const getFixturePath = (path: string) => join(__dirname, "../../fixture", path);

describe("resolver", () => {
  beforeEach(() => {
    (global as any).vm2 = require("vm2");
  });

  it("resolves a simple .flyde file without any dependencies", () => {
    const data = resolveFlow(getFixturePath("simple.flyde"));

    assert.equal(data.main.id, "Simple");
    assert.exists(data.main.instances);
    assert.exists(data.main.connections);
  });

  it("resolves a .flyde with dependency on an inline code part from another Flyde file ", async () => {
    const data = resolveFlow(getFixturePath("a-imports-js-part-from-b/a.flyde"));
    const part = data.main;

    const repo = data.dependencies as PartRepo;

    const val = await simplifiedExecute(part, repo, { n: 2 });

    assert.equal(val, 3);
  }, 50);

  it("resolves flows with transitive dependencies", async () => {
    const data = resolveFlow(getFixturePath("a-imports-b-imports-c/Container.flyde"));

    const repo = data.dependencies as PartRepo;

    const val = await simplifiedExecute(data.main, repo, { n: 2 });

    assert.equal(val, 3);
  });

  it("resolves flows with 2 levels of transitive dependencies and properly namespaces them", async () => {
    const data = resolveFlow(getFixturePath("a-imports-b-imports-c-imports-d/Container.flyde"));

    const repo = data.dependencies as PartRepo;

    const keys = _.keys(repo);

    assert.deepEqual(keys, [
      "Add1WrapperTwice__Add1Wrapper__Add1",
      "Add1WrapperTwice__Add1Wrapper",
      "Add1WrapperTwice",
    ]);

    const val = await simplifiedExecute(data.main, repo, { n: 2 });

    assert.equal(val, 3);
  });

  it("avoids clashes in imports by namespacing imports", async () => {
    /*
       part Container will import 2 parts, each importing a part 
       named "Special" but with a different content (one does +1, the other does -1)
    */
    const data = resolveFlow(
      getFixturePath("a-imports-b-and-c-potential-ambiguity/Container.flyde")
    );
    const repo = data.dependencies as PartRepo;

    assert.deepEqual(_.keys(repo), [
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
      partsRepo: repo,
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
    const data = resolveFlow(
      getFixturePath("a-imports-b-code-from-package/a.flyde"),
      "implementation"
    );

    const repo = data.dependencies as PartRepo;
    const res = await simplifiedExecute(data.main, repo, { n: 2 });
    assert.equal(res, 3);
    assert.match(data.dependencies.Add1.importPath, /@acme\/add1\/src\/add1\.flyde\.js$/);
  });

  it("resolves a .flyde with dependency on a grouped part from a different package", async () => {
    const data = resolveFlow(
      getFixturePath("a-imports-b-grouped-from-package/a.flyde"),
      "implementation"
    );

    const repo = data.dependencies as PartRepo;

    const res = await simplifiedExecute(data.main, repo, { n: 2 });
    assert.equal(res, 3);
    assert.match(
      data.dependencies.Add1Wrapped.importPath,
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
      const contents = readFileSync(path, "utf-8");

      assert.throws(
        () => {
          deserializeFlow(contents, path);
        },
        /Error parsing/,
        `File ${invalid} should have failed schema validation`
      );
    }
  });

  it("allows importing simple code based parts", async () => {
    const path = getFixturePath("CompleteCodePart.flyde.js");
    const flow = resolveFlow(path);

    assert.exists(flow.main.customViewCode);
    assert.deepEqual(flow.main.completionOutputs, ["r"]);
    assert.deepEqual(flow.main.reactiveInputs, ["b"]);
  });

  it("allows importing simple code based parts that require packages", async () => {
    const path = getFixturePath("a-imports-js-part-from-b-with-dep/a.flyde");
    const flow = resolveFlow(path);

    const repo = flow.dependencies as PartRepo;
    const val = await simplifiedExecute(flow.main, repo, { n: 2 });
    assert.equal(val, 3);
  });

  it("bundles flows importing simple code based parts as expected", async () => {
    const path = getFixturePath("a-imports-js-part-from-b-with-dep/a.flyde");
    const flow = resolveFlow(path, "bundle");

    assert.match((flow.dependencies.Add as any).fn, /__BUNDLE_FN:\[\[\Add\.flyde\.js\]\]/);
  });

  it("throws error when importing part that has a missing dep transitively", async () => {
    const path = getFixturePath("a-imports-b-with-missing-deps/a.flyde");
    assert.throws(() => {
      resolveFlow(path);
    }, /not imported/);
  });

  it("throws error when importing part that has a missing dep directly", async () => {
    // has a missing depen
    const path = getFixturePath("a-imports-b-with-missing-deps/SpreadList3.flyde");
    assert.throws(() => {
      resolveFlow(path);
    }, /GetListItem/);
  });

  it("only resolves imported parts, aka does not break if a package exports a broken part that is not imported", () => {
    const path = getFixturePath("imports-ok-from-package-with-problematic.flyde");

    const flow = resolveFlow(path);
    assert.exists(flow.dependencies.Ok);
    assert.notExists(flow.dependencies.Problematic);
  });

  it("imports multiple parts from the same package", async () => {
    const path = getFixturePath("imports-2-parts-from-package.flyde");

    const flow = resolveFlow(path);
    const repo = flow.dependencies as PartRepo;
    const val = await simplifiedExecute(flow.main, repo, { n: 2 });
    assert.equal(val, 2 + 1 + 2);
  }, 20);

  it("properly resolves recursions", async () => {
    const path = getFixturePath("recursive.flyde");

    assert.doesNotThrow(() => {
      resolveFlow(path);
    });
  }, 20);

  it("bundles a .flyde code dependencies from packages relative to the original flow", async () => {
    /* this originated from the following bug: Fib playground example depended on "Merge" which depended on "Id"
    Id's reference was bundled in relation to Merge, (i.e. "./Id.flyde.js") instead of the original flow ('../../../node_modules..) 
    Causing webpack not to be able to load it
    */
    const data = resolveFlow(getFixturePath("a-imports-b-grouped-from-package/a.flyde"), "bundle");

    const repo = data.dependencies as PartRepo;
    const Add1 = repo.Add1Wrapped__Add1 as ImportedPart & PreBundleNativePart;

    assert.match(Add1.importPath, /@acme\/add1-wrapped\/src\/Add1\.flyde\.js$/);
    assert.equal(Add1.fn, "__BUNDLE_FN:[[../node_modules/@acme/add1-wrapped/src/Add1.flyde.js]]");
  });

  it("resolves dependencies of inline parts", async () => {
    const flow = resolveFlow(getFixturePath("a-uses-inline-part-with-dependency/a.flyde"));

    const repo = flow.dependencies as PartRepo;
    console.log(repo);

    assert.exists(repo.Add);
    const val = await simplifiedExecute(flow.main, repo, { n: 2 });
    assert.equal(val, 2 + 1);
  });

  it("resolves dependencies of imported inline parts", async () => {
    const flow = resolveFlow(
      getFixturePath("a-uses-inline-part-with-dependency/b-imports-a.flyde")
    );

    const repo = flow.dependencies as PartRepo;

    assert.exists(repo.Add1Wrapper);
    const val = await simplifiedExecute(flow.main, repo, { n: 2 });

    assert.equal(val, 2 + 1);
  });

  describe("typescript", () => {
    it("runs code parts written in TS", async () => {
      const data = resolveFlow(getFixturePath("a-imports-ts-part-from-b/a.flyde"));
      const part = data.main;

      const repo = data.dependencies as PartRepo;

      const val = await simplifiedExecute(part, repo, { n: 2 });

      assert.equal(val, 1);
    });
  });
});
