/*
    first version of Flyde ran code parts in VM2 for security,
    but now given that it's running user code, not sure it's needed anymore..
*/

import { fakeVm } from "./fake-vm2";

export const getVM2Instance = () => {
    // try {
    //     const vm2 = require("vm2");

    //     const script = new vm2.VMScript('return "hello world"');
    //     const vm = new vm2.VM({});
    //     vm.run(script);
    //     return vm2;
    // } catch (e) {
    //     console.log('424242');
        
        return fakeVm;
    // }
}