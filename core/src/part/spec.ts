import { runAddTests } from "./add-tests";
import { add, codeAdd, testRepo } from "../fixture";
import { inlineValuePartToPart } from "../inline-value-to-code-part";

describe("add tests", () => {
  describe("normal", () => {
    runAddTests(add, "part", {});
  });

  describe("fromCode", () => {
    runAddTests(codeAdd, "code-part", {});
  });
});
