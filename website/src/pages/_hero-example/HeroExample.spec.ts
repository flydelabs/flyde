import nock from "nock";

import { loadFlow } from "@flyde/runtime";
import { assert } from "chai";

describe("Hero examples", () => {
  afterEach(() => {
    nock.restore();
  });

  it("runs hello world example", async () => {
    const execute = await loadFlow("./ExampleHelloWorld.flyde", __dirname);

    const timedValues = [];
    await execute(
      {},
      {
        onOutputs: (_, value) => timedValues.push({ value, time: Date.now() }),
      }
    ).result;

    assert.deepEqual(
      timedValues.map((v) => v.value),
      ["Hello", "World!"]
    );

    const timeDiff = timedValues[1].time - timedValues[0].time;
    assert.isAtLeast(timeDiff, 3000);
  }).timeout(5000);

  it("runs debounce throttle example", async () => {
    const execute = await loadFlow(
      "./ExampleDebounceThrottle.flyde",
      __dirname
    );

    const result = await execute({}).result;

    assert.deepEqual(result.output, ["✅", "🕐", "❌"]);
  }).timeout(6000);

  it("runs reactivity example", async () => {
    const execute = await loadFlow("./ExampleReactivity.flyde", __dirname);

    const result = await execute({}).result;

    assert.deepEqual(result.output, ["beep", "boop", "bop"]);
  }).timeout(6000);

  it("runs http example", async () => {
    // Mock the first API call to get the country
    nock("https://api.country.is").get("/").reply(200, { country: "IL" });

    // Mock the second API call to get the capital
    nock("https://countriesnow.space")
      .post("/api/v0.1/countries/capital", { iso2: "IL" })
      .reply(200, {
        data: {
          name: "Denmark",
          capital: "Copenhagen",
        },
      });

    const execute = await loadFlow("./ExampleHTTPRequests.flyde", __dirname);

    const { output } = await execute().result;

    assert.deepEqual(output, "You're in Denmark, whose capital is Copenhagen");
  }).timeout(6000);
});
