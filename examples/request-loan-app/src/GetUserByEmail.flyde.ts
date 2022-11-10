import { nativeFromFunction, NativePart } from "@flyde/core";
import { crmService } from "./lib/crm-service";

const GetUserByEmail: NativePart = nativeFromFunction({
    id: 'Get User By Email',
    fn: crmService.getUser,
    inputNames: ['email'],
    outputName: 'user'
});

export = GetUserByEmail;