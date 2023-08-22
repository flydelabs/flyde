/*
    first version of Flyde ran code nodes in VM2 for security,
    but now given that it's running user code, not sure it's needed anymore..
*/

import { fakeVm } from "./fake-vm2";

export const getVM2Instance = () => {
  
  return fakeVm;
};
