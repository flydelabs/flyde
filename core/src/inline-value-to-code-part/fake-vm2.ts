/*
    vm2 created a performance issue in web projects and is not really needed
    in client projects as there is not real risk
*/

import { okeys } from "../common";


export class VMScript {
  script: string;

  constructor(s: string) {
    this.script = s;
  }
}

export class VM {
  context: any;
  constructor(context: any) {
    this.context = context;
  }

  run(script: VMScript) {
    const args = okeys(this.context.sandbox);
    const values = Object.values(this.context.sandbox);
    const fn = Function(...args, script.script);
    fn(...values);
  }
}

export const fakeVm = {
  VMScript,
  VM,
};
