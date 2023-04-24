import { assert } from "chai";
import { loadFlow } from "@flyde/runtime";

describe("Hero example", () => {
  it("runs hero core example properly", async () => {
    const executeFlow = loadFlow("./src/pages/_hero-example/Hero.flyde");
    const { result } = executeFlow();
    const { output } = await result;
    assert.include(output, "Looks like you're from");
  }).timeout(10000);
});
