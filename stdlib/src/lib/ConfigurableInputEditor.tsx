import { Radio, RadioGroup } from "@blueprintjs/core";
import { ConfigurableInput } from "./ConfigurableInput";
import React from "react";

export interface ValueComp<T> {
  value: T;
  onChange: (value: T) => void;
}

export interface ConfigurableInputEditorProps<T extends Record<string, any>> {
  value: ConfigurableInput<T>;
  onChange: (value: ConfigurableInput<T>) => void;
  valueRenderer: React.FC<ValueComp<T>>;
  modeLabel: string;
  defaultStaticValue: T;
}

export const ConfigurableInputEditor = <T extends Record<string, any>>({
  value,
  onChange,
  valueRenderer: ValueRenderer,
  defaultStaticValue,
  modeLabel,
}: ConfigurableInputEditorProps<T>) => {
  const handleModeChange = (e: React.FormEvent<HTMLInputElement>) => {
    onChange({
      mode: e.currentTarget.value as "static" | "dynamic",
      ...(e.currentTarget.value === "static" ? defaultStaticValue : {}),
    });
  };

  const handleValueChange = (value: T) => {
    onChange({
      ...value,
      mode: "static",
    });
  };

  const MemoValueRenderer = React.useMemo(() => ValueRenderer, []);
  return (
    <>
      <RadioGroup
        label={modeLabel}
        onChange={handleModeChange}
        selectedValue={value.mode}
        inline
      >
        <Radio label="Static" value="static" />
        <Radio label="Dynamic" value="dynamic" />
      </RadioGroup>
      {value.mode === "static" ? (
        <MemoValueRenderer value={value} onChange={handleValueChange} />
      ) : null}
    </>
  );
};

export const createConfigurableInputEditor = <T extends Record<string, any>>(
  valueRenderer: React.FC<ValueComp<T>>
) => {
  return (props: Omit<ConfigurableInputEditorProps<T>, "valueRenderer">) => (
    <ConfigurableInputEditor {...props} valueRenderer={valueRenderer} />
  );
};
