import { eventually } from "@flyde/core";
import { assert } from "chai";
import { join } from "path";
import Sinon = require("sinon");
import { loadFlow } from ".";

const loadFixture = (name: string) => {
  return loadFlow(`./src/fixture/${name}.flyde`, join(__dirname, ".."));
};
describe("runtime", () => {
  describe("loadFlow", () => {
    it("resolves promise with completed values - simple case", async () => {
      const execute = loadFixture("HelloWorld");
      const { result } = await execute().result;
      assert.equal(result, "Hello");
    });

    it("resolves promise with multiple completed values", async () => {
      const execute = loadFixture("DblHelloWorld");
      const { res1, res2 } = await execute().result;
      assert.equal(res1, "Hello");
      assert.equal(res2, "World");
    });

    it.skip("allows listening to values before promise is completed", async () => {
      const execute = loadFixture("HelloWorldWithProgression");
      const spy = Sinon.spy();
      const { result } = await execute({}, { onOutputs: spy }).result;

      assert.equal(spy.callCount, 4);
      // assert.deepEqual(
      //   spy.getCalls().map((call) => call.args[1]),
      //   [1, 2, 3, "Bob"]
      // );

      // log

      assert.equal(result, "Bob");
    });

    it("properly loads flow that uses a code node stored relative to the flow", async () => {
      const execute = loadFixture("flow-and-code/CallsBob");
      const { res } = await execute().result;

      assert.equal(res, "Bob");
    });

    it.skip("cleans up execution when done", async () => {
      /*
              NodeWithCleanupWrapper uses "node-with-cleanup" that uses the cleanup hook
              connected to the "cleanupSpy" external dependency
              test assumes if that spy is called the whole cleanup flow is properly triggered
            */
      const execute = loadFixture("NodeWithCleanupWrapper");
      const spy = Sinon.spy();

      const { res } = await execute({}, { extraContext: { cleanupSpy: spy } })
        .result;

      await eventually(() => {
        assert.equal(spy.callCount, 1);
      });
    });
  });
});
