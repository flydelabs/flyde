import { codeFromFunction, InternalCodeNode } from "@flyde/core";
import { crmService } from "./lib/crm-service";

const GetUserByEmail: InternalCodeNode = codeFromFunction({
  id: "Get User By Email",
  fn: crmService.getUser,
  inputNames: ["email"],
  outputName: "user",
});

export = GetUserByEmail;
