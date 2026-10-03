import * as assert from "assert";
import * as sinon from "sinon";
import { FlowDocumentWriter, FlowSaveResult, WebviewFlowSaver } from "../flowDocumentSync";

type Flow = { source: string; x: number };
const initialFlow = (): Flow => ({ source: "./Child.flyde", x: 0 });

suite("Flow document synchronization", () => {
  let clock: sinon.SinonFakeTimers;
  setup(() => { clock = sinon.useFakeTimers(); });
  teardown(() => { clock.restore(); });

  test("a prior visual save does not suppress a rename or restore its old import on the next edit", async () => {
    let text = JSON.stringify(initialFlow());
    let version = 1;
    let visualFlow = initialFlow();
    const changes: boolean[] = [];
    const errors: unknown[] = [];
    let saver: WebviewFlowSaver<Flow>;
    const changed = () => {
      const ownChange = writer.isOwnChange(text, version);
      changes.push(ownChange);
      if (!ownChange && saver.acceptExternalChange(version)) {
        visualFlow = JSON.parse(text);
      }
    };
    const writer = new FlowDocumentWriter({
      getText: () => text,
      get version() { return version; },
      apply: async (value) => {
        text = value;
        version++;
        changed();
        return true;
      },
    });
    saver = new WebviewFlowSaver(1,
      (flow, baseVersion) => writer.write(JSON.stringify(flow), baseVersion),
      (error) => errors.push(error));

    visualFlow = { ...visualFlow, x: 10 };
    saver.schedule(visualFlow);
    await clock.tickAsync(500);
    assert.deepStrictEqual(changes, [true]);

    text = JSON.stringify({ ...visualFlow, source: "./moved/Child.flyde" });
    version++;
    changed();
    assert.deepStrictEqual(changes, [true, false]);
    assert.strictEqual(visualFlow.source, "./moved/Child.flyde");

    visualFlow = { ...visualFlow, x: 20 };
    saver.schedule(visualFlow);
    await clock.tickAsync(500);
    assert.deepStrictEqual(JSON.parse(text), { source: "./moved/Child.flyde", x: 20 });
    assert.deepStrictEqual(changes, [true, false, true]);
    assert.deepStrictEqual(errors, []);
    saver.dispose();
  });

  test("an external rename cancels a pending debounced save", async () => {
    const writes: Flow[] = [];
    const saver = new WebviewFlowSaver<Flow>(1, async (flow, version) => {
      writes.push(flow);
      return { documentVersion: version + 1, applied: true };
    }, () => assert.fail("save should not fail"));

    saver.schedule({ ...initialFlow(), x: 10 });
    await clock.tickAsync(250);
    saver.acceptExternalChange(2);
    await clock.tickAsync(1000);
    assert.deepStrictEqual(writes, []);

    saver.schedule({ source: "./moved/Child.flyde", x: 20 });
    await clock.tickAsync(500);
    assert.deepStrictEqual(writes, [{ source: "./moved/Child.flyde", x: 20 }]);
    saver.dispose();
  });

  test("queued old saves are discarded and a late acknowledgement cannot roll back the version", async () => {
    let finishFirst!: (value: FlowSaveResult) => void;
    const first = new Promise<FlowSaveResult>((resolve) => { finishFirst = resolve; });
    const calls: { flow: Flow; version: number }[] = [];
    const saver = new WebviewFlowSaver<Flow>(1, async (flow, version) => {
      calls.push({ flow, version });
      return calls.length === 1 ? first : { documentVersion: version + 1, applied: true };
    }, () => assert.fail("save should not fail"));

    saver.schedule({ ...initialFlow(), x: 1 });
    await clock.tickAsync(500);
    saver.schedule({ ...initialFlow(), x: 2 });
    await clock.tickAsync(500);
    assert.strictEqual(calls.length, 1);

    saver.acceptExternalChange(5);
    finishFirst({ documentVersion: 2, applied: true });
    await clock.tickAsync(0);
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(saver.acceptExternalChange(4), false);

    saver.schedule({ source: "./moved/Child.flyde", x: 3 });
    await clock.tickAsync(500);
    assert.strictEqual(calls[1].version, 5);
    assert.strictEqual(calls[1].flow.source, "./moved/Child.flyde");
    saver.dispose();
  });

  test("a save posted before an external edit cannot overwrite the new document", async () => {
    let text = "renamed document";
    let applies = 0;
    const writer = new FlowDocumentWriter({
      getText: () => text,
      version: 3,
      apply: async (value) => { applies++; text = value; return true; },
    });
    assert.deepStrictEqual(await writer.write("stale document", 2), {
      documentVersion: 3, applied: false,
    });
    assert.strictEqual(text, "renamed document");
    assert.strictEqual(applies, 0);
  });

  test("a stale-save rejection discards queued snapshots before external resolution completes", async () => {
    let finishFirst!: (value: FlowSaveResult) => void;
    const first = new Promise<FlowSaveResult>((resolve) => { finishFirst = resolve; });
    let writes = 0;
    const saver = new WebviewFlowSaver<Flow>(1, async () => {
      writes++;
      return first;
    }, () => assert.fail("save should not fail"));
    saver.schedule(initialFlow());
    await clock.tickAsync(500);
    saver.schedule({ ...initialFlow(), x: 1 });
    await clock.tickAsync(500);
    finishFirst({ documentVersion: 2, applied: false });
    await clock.tickAsync(0);
    assert.strictEqual(writes, 1);
    saver.dispose();
  });

  test("failed WorkspaceEdits reject the save and do not poison later saves", async () => {
    let text = "before";
    let version = 1;
    let fail = true;
    const writer = new FlowDocumentWriter({
      getText: () => text,
      get version() { return version; },
      apply: async (value) => {
        if (fail) { return false; }
        text = value;
        version++;
        assert.strictEqual(writer.isOwnChange(text, version), true);
        return true;
      },
    });
    await assert.rejects(writer.write("failed", 1), /changed before the save/);
    assert.strictEqual(writer.isOwnChange("failed", 2), false);
    fail = false;
    assert.deepStrictEqual(await writer.write("saved", 1), { documentVersion: 2, applied: true });
  });

  test("an identical text change with the wrong version is external, not a self echo", async () => {
    const writer = new FlowDocumentWriter({
      getText: () => "before",
      version: 1,
      apply: async (text) => {
        assert.strictEqual(writer.isOwnChange(text, 3), false);
        assert.strictEqual(writer.isOwnChange(text, 2), false);
        return true;
      },
    });
    await writer.write("after", 1);
  });

  test("disposing the visual editor cancels pending saves", async () => {
    let writes = 0;
    const saver = new WebviewFlowSaver(1, async () => {
      writes++;
      return { documentVersion: 2, applied: true };
    }, () => assert.fail("save should not fail"));
    saver.schedule(initialFlow());
    saver.dispose();
    await clock.tickAsync(1000);
    assert.strictEqual(writes, 0);
  });
});
