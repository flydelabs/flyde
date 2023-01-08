import { runAddTests } from "./add-tests";
import { add, codeAdd, testRepo } from "../fixture";
import { inlineValuePartToPart } from "../code-to-native";

describe("add tests", () => {
  describe("normal", () => {
    runAddTests(add, "part", {});
  });

  describe("fromCode", () => {
    runAddTests(codeAdd, "code-part", {});
  });
});
