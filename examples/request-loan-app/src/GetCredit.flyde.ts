import { codeFromFunction, CodeNode } from "@flyde/core";
import { creditService } from "./lib/credit-service";

const GetCredit: CodeNode = codeFromFunction({
  id: "Get Credit By Id",
  fn: creditService.getCredit,
  inputNames: ["userId"],
  outputName: "credit",
});

export = GetCredit;
