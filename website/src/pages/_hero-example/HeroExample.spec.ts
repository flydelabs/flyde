import nock from "nock";

describe("Hero example", () => {
  afterEach(() => {
    nock.restore();
  });

  it.skip("runs hero example properly", async () => {
    // leaving this here just so mocha doesn't complain about no tests
    // TODO - write tests for the example flows
  }).timeout(10000);
});
