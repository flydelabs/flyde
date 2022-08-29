export type TestDataCreator<T> = (partial?: Partial<T>) => T;

export type ObjOrObjCreator<T> = T | (() => T);

export const testDataCreator = <T extends object>(
  defaults: ObjOrObjCreator<T>
): TestDataCreator<T> => {
  return (partial = {}) => {
    // tslint:disable-next-line:ban-types
    const objDefaults = (
      typeof defaults === "function" ? (defaults as Function)() : defaults
    ) as object;
    const objPartial = partial as object;
    // tslint:disable-next-line:no-object-literal-type-assertion
    const ret: any = { ...objDefaults, ...objPartial } as T;
    return ret;
  };
};
