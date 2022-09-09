import { CodePart, GroupedPart, InlinePartInstance, NativePart, RefPartInstance } from "@flyde/core";
import { assert } from "chai";
import { readdirSync } from "fs";
import { join } from "path";
import { spy } from "sinon";
import { deserializeFlow } from "../serdes";
import { simplifiedExecute } from "../simplified-execute";
import { resolveFlow } from "./resolve-flow";

const getFixturePath = (path: string) => join(__dirname, "../../fixture", path);

describe("resolver", () => {
  beforeEach(() => {
    (global as any).vm2 = require("vm2");
  });
  it("resolves a simple .flyde file without any dependency into a repo", () => {
    const data = resolveFlow(getFixturePath("simple.flyde"));
    assert.exists(data.main);
    assert.equal(data.main.inputs.n1.type, "number");
  });

  it("resolves a part with native code reference", () => {
    const data = resolveFlow(getFixturePath("local-code-ref.flyde"), "implementation");

    const outputs = { result: { next: spy() } } as any;

    const main = data.main as NativePart;

    assert.isFunction(main.fn);
    main.fn({ n1: 1, n2: 2 }, outputs);
    assert.isTrue(outputs.result.next.calledWith(3));
  });

  it("resolves a .flyde with dependency on an inline code part from another Flyde file ", () => {
    const data = resolveFlow(getFixturePath("a-imports-inline-fn-from-b/a.flyde"));

    const Add = data.Add as CodePart;
    assert.exists(Add);
    assert.exists(Add.fnCode);
  });

  it("resolves a .flyde with dependency on a grouped part from a different package", () => {
    const data = resolveFlow(
      getFixturePath("a-imports-code-fn-from-package/a.flyde"),
      "implementation"
    );

    const Multiply = data.Multiply as NativePart;
    assert.exists(Multiply);
    assert.isFunction(Multiply.fn);
    const outputs = { result: { next: spy() } };
    Multiply.fn({ n1: 2, n2: 3 }, outputs as any);
    assert.isTrue(outputs.result.next.calledWith(6));
  });

  it("supports aliases for imports", () => {
    const file = getFixturePath("a-imports-aliased-part-from-b/a.flyde");
    const data = resolveFlow(file, "implementation");

    const Bob = data.Bob as NativePart;
    assert.exists(Bob);
    assert.isFunction(Bob.fn);
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
          deserializeFlow(path, '');
        },
        /Error parsing/,
        `File ${invalid} should have failed schema validation`
      );
    }
  });

  it("works on imported parts that have transitive dependencies that were not imported explicitly", async () => {
    const path = getFixturePath("a-imports-b-with-internal-transitive-dep/a.flyde");
    const flow = resolveFlow(path, "implementation");

    assert.isUndefined(flow.Exponent, "Exponent should have been namespaced");
    assert.isDefined(flow["Exponent2__Exponent"]);

    const val = await simplifiedExecute(flow.Exponent2, flow, { n: 2 });
    assert.equal(val, 4);
  });

  it("works on imported parts that have 2nd level transitive dependencies that were not imported explicitly", async () => {
    const path = getFixturePath("a-imports-b-with-2-level-internal-transitive-dep/a.flyde");
    const flow = resolveFlow(path, "implementation");

    // console.log({flow});

    assert.isUndefined(flow.Add, "internals should have been namespaced");
    assert.isUndefined(flow.Add42, "internals should have been namespaced");
    assert.isDefined(flow["Add42And73"]);
    // assert.isDefined(flow['Add42And73__Add42']);
    // assert.isDefined(flow['Exponent2.Exponent']);

    const val = await simplifiedExecute(flow.Add42And73, flow, { n1: 2 });
    assert.equal(val, 42 + 73 + 2);
  });

  it("does not allow to import a non-exported part", () => {
    const path = getFixturePath("a-imports-non-exported-from-b/a.flyde");

    assert.throws(() => {
      resolveFlow(path);
    }, /not exporting/);
  });

  it.only('allows importing simple code based parts', async () => { 
    const path = getFixturePath("a-imports-js-part-from-b/a.flyde");
    const flow = resolveFlow(path);
    
    const val = await simplifiedExecute(flow.Add1, flow, { n: 2 });
    assert.equal(val, 3);
  });

  it('allows importing simple code based parts that require packages', async () => { 
    const path = getFixturePath("a-imports-js-part-from-b-with-dep/a.flyde");
    const flow = resolveFlow(path);
    
    const val = await simplifiedExecute(flow.Add1, flow, { n: 2 });
    assert.equal(val, 3);
  });

  it.only('bundles flows importing simple code based parts as expected', async () => { 
    const path = getFixturePath("a-imports-js-part-from-b-with-dep/a.flyde");
    const flow = resolveFlow(path, 'bundle');
    
    assert.match((flow.Add as any).fn, /__BUNDLE_FN:\[\[\Add\.flyde\.js\]\]/);
  });

  it.only('throws error when importing part that has a missing dep transitively', async () => { 
    const path = getFixturePath("a-imports-b-with-missing-deps/a.flyde");
    assert.throws(() => {
      resolveFlow(path); 
    }, /Unable to find part/)
  });

  it.only('throws error when importing part that has a missing dep directly', async () => { 
    // has a missing depen
    const path = getFixturePath("a-imports-b-with-missing-deps/SpreadList3.flyde");
    assert.throws(() => {
      resolveFlow(path); 
    }, /GetListItem/)
  });

  it.only('only resolves imported parts, aka does not break if a package exports a broken part that is not imported', () => {
    const path = getFixturePath("imports-ok-from-package-with-problematic.flyde");
    
    const flow = resolveFlow(path);
    assert.exists(flow.Ok);
    assert.notExists(flow.Problematic);
  })

  it('works for counter example', async () => { 
    const path = getFixturePath("react-counter-example/react-counter.flyde");
    const flow = resolveFlow(path, 'bundle');

    assert.exists(flow.Button);
    assert.exists(flow.Span);
  });

});
