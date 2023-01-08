import { nativeFromFunction, CodePart } from "@flyde/core";
import { creditService } from "./lib/credit-service";

const GetCredit: CodePart = nativeFromFunction({
  id: "Get Credit By Id",
  fn: creditService.getCredit,
  inputNames: ["userId"],
  outputName: "credit",
});

export = GetCredit;
