import axios from "axios";
import { assert } from "chai";
import nock from "nock";
import { loadFlow } from "@flyde/runtime";

describe("Hero example", () => {
  afterEach(() => {
    nock.restore();
  });

  it("runs hero core example properly", async () => {
    nock("https://api.country.is").get("/").reply(200, { country: "DK" }); // CI is in USA, which returns just "Washington", which fails the population API.
    const executeFlow = loadFlow("./src/pages/_hero-example/Hero.flyde");
    const { result } = executeFlow();
    const { output } = await result;
    assert.include(output, "Looks like you're from Denmark!");
  }).timeout(10000);
});
