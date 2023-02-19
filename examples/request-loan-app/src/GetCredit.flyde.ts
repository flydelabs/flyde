import { codeFromFunction, CodePart } from "@flyde/core";
import { creditService } from "./lib/credit-service";

const GetCredit: CodePart = codeFromFunction({
  id: "Get Credit By Id",
  fn: creditService.getCredit,
  inputNames: ["userId"],
  outputName: "credit",
});

export = GetCredit;
