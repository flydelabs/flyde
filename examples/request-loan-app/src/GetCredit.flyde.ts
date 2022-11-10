import { nativeFromFunction, NativePart } from "@flyde/core";
import { creditService } from "./lib/credit-service";

const GetCredit: NativePart = nativeFromFunction({
    id: 'Get Credit By Id',
    fn: creditService.getCredit,
    inputNames: ['userId'],
    outputName: 'credit'
});

export = GetCredit;