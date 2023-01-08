import { nativeFromFunction, CodePart } from "@flyde/core";
import { crmService } from "./lib/crm-service";

const GetUserByEmail: CodePart = nativeFromFunction({
  id: "Get User By Email",
  fn: crmService.getUser,
  inputNames: ["email"],
  outputName: "user",
});

export = GetUserByEmail;
