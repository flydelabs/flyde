import { codeFromFunction } from "@flyde/core";
import { riskService } from "./lib/risk-service";

export = codeFromFunction({
  id: "Calculate Risk",
  inputNames: ["userId", "amount"],
  outputName: "risk",
  fn: riskService.calculateRisk,
});
