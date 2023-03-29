import { runAddTests } from "./add-tests";
import { add, codeAdd } from "../fixture";

describe("add tests", () => {
  describe("normal", () => {
    runAddTests(add, "part", {});
  });

  describe("fromCode", () => {
    runAddTests(codeAdd, "code-part", {});
  });
});
