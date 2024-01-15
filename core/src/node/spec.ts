import { runAddTests } from "./add-tests";
import { add } from "../fixture";

describe("add tests", () => {
  describe("normal", () => {
    runAddTests(add, "node", {});
  });
});
