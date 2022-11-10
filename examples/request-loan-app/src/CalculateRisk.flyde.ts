import { nativeFromFunction } from "@flyde/core";
import { riskService } from "./lib/risk-service";

export = nativeFromFunction({
    id: 'Calculate Risk',
    inputNames: ['userId', 'amount'],
    outputName: 'risk',
    fn: riskService.calculateRisk
})