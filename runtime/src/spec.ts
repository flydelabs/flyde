import { assert } from "chai";
import EventEmitter = require("events");
import { dirname, join } from "path";
import Sinon = require("sinon");
import { loadFlowByPath } from ".";

const loadFixture = (name: string) => {
  return loadFlowByPath(`./src/fixture/${name}.flyde`, join(__dirname, ".."));
};
describe("runtime", () => {
  describe("loadFlow", () => {
    it("resolves promise with completed values - simple case", async () => {
      const execute = loadFixture("HelloWorld");
      const { result } = await execute().result;
      assert.equal(result, "Hello World");
    });

    it("resolves promise with multiple completed values", async () => {
      const execute = loadFixture("DblHelloWorld");
      const { res1, res2 } = await execute().result;
      assert.equal(res1, "Hello");
      assert.equal(res2, "World");
    });

    it("allows listening to values before promise is completed", async () => {
      const execute = loadFixture("HelloWorldWithProgression");
      const spy = Sinon.spy();
      const { result } = await execute({}, { onOutputs: spy }).result;

      assert.equal(spy.callCount, 4);
      assert.deepEqual(
        spy.getCalls().map((call) => call.args[1]),
        [1, 2, 3, "Bob"]
      );

      assert.equal(result, "Bob");
    });

    it("cleans up execution when done", async () => {
      /*
              PartWithCleanupWrapper uses "part-with-cleanup" that uses the cleanup hook
              connected to the "cleanupSpy" external dependency
              test assumes if that spy is called the whole cleanup flow is properly triggered
            */
      const execute = loadFixture("PartWithCleanupWrapper");
      const spy = Sinon.spy();

      const { res } = await execute({}, { extraContext: { cleanupSpy: spy } }).result;

      assert.equal(spy.callCount, 1);
    });
  });
});
