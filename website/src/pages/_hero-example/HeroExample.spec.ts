import nock from "nock";
import { loadFlow } from "@flyde/runtime";
import { assert } from "chai";
import { delay, eventually } from "@flyde/core";

describe("Hero examples", () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it("runs hello world example", async () => {
    const execute = loadFlow("./ExampleHelloWorld.flyde", __dirname);

    const timedValues = [];

    execute(
      {},
      {
        onOutputs: (_, value) => {
          timedValues.push({ value, time: Date.now() });
        },
      }
    );

    await delay(2000);

    assert.deepEqual(
      timedValues.map((v) => v.value),
      ["Hello", "World!"]
    );

    const timeDiff = timedValues[1].time - timedValues[0].time;
    assert.isAtLeast(timeDiff, 1500);
  }).timeout(5000);

  it("runs debounce throttle example", async () => {
    const execute = await loadFlow(
      "./ExampleDebounceThrottle.flyde",
      __dirname
    );

    const result = await execute({}).result;

    assert.deepEqual(result.output, ["✅", "🕐", "❌"]);
  }).timeout(10000);

  it("runs reactivity example", async () => {
    const execute = await loadFlow("./ExampleReactivity.flyde", __dirname);

    const result = await execute({}).result;

    assert.deepEqual(result.output, ["beep", "boop", "bop"]);
  }).timeout(10000);

  it("runs http example", async () => {
    const execute = await loadFlow("./ExampleHTTPRequests.flyde", __dirname);

    const { output } = await execute().result;

    assert.match(output, /^You're in (.*), whose capital is (.*)$/);
  }).timeout(15000);
});
