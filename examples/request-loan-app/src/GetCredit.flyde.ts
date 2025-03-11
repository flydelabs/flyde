import { codeFromFunction, InternalCodeNode } from "@flyde/core";
import { creditService } from "./lib/credit-service";

const GetCredit: InternalCodeNode = codeFromFunction({
  id: "Get Credit By Id",
  fn: creditService.getCredit,
  inputNames: ["userId"],
  outputName: "credit",
});

export = GetCredit;
