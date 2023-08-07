import { codeFromFunction, CodeNode } from "@flyde/core";
import { crmService } from "./lib/crm-service";

const GetUserByEmail: CodeNode = codeFromFunction({
  id: "Get User By Email",
  fn: crmService.getUser,
  inputNames: ["email"],
  outputName: "user",
});

export = GetUserByEmail;
