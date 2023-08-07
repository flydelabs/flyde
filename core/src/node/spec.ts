import { runAddTests } from "./add-tests";
import { add, codeAdd } from "../fixture";

describe("add tests", () => {
  describe("normal", () => {
    runAddTests(add, "node", {});
  });

  describe("fromCode", () => {
    runAddTests(codeAdd, "code-node", {});
  });
});
