type ConfigurableInputStatic<T> = {
  mode: "static";
} & T;

type ConfigurableInputDynamic = {
  mode: "dynamic";
};

export type ConfigurableInput<T> =
  | ConfigurableInputStatic<T>
  | ConfigurableInputDynamic;
