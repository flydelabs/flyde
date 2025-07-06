import React from "react";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";

export type ConfigurableInputStatic<T> = {
  mode: "static";
  value: T;
};

export type ConfigurableInputDynamic = {
  mode: "dynamic";
};

export type ConfigurableInput<T> =
  | ConfigurableInputStatic<T>
  | ConfigurableInputDynamic;

export interface ValueCompProps<T> {
  value: T;
  onChange: (value: T) => void;
}

export interface ConfigurableInputEditorProps<T> {
  value: ConfigurableInput<T>;
  onChange: (value: ConfigurableInput<T>) => void;
  valueRenderer: React.FC<ValueCompProps<T>>;
  modeLabel: string;
  defaultStaticValue: T;
}

export const ConfigurableInputEditor = function <T>({
  value,
  onChange,
  valueRenderer: ValueRenderer,
  defaultStaticValue,
  modeLabel,
}: ConfigurableInputEditorProps<T>) {
  const handleModeChange = (newMode: string) => {
    onChange({
      mode: newMode as "static" | "dynamic",
      value: newMode === "static" ? defaultStaticValue : undefined as any,
    });
  };

  const handleValueChange = (value: T) => {
    onChange({
      value,
      mode: "static",
    });
  };

  const MemoValueRenderer = React.useMemo(() => ValueRenderer, [ValueRenderer]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ marginBottom: "4px" }}>
        <Label>{modeLabel}</Label>
      </div>
      <RadioGroup
        value={value.mode}
        onValueChange={handleModeChange}
        style={{ display: "flex", gap: "12px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <RadioGroupItem value="static" id="static" />
          <Label htmlFor="static">Static</Label>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <RadioGroupItem value="dynamic" id="dynamic" />
          <Label htmlFor="dynamic">Dynamic</Label>
        </div>
      </RadioGroup>
      {value.mode === "static" ? (
        <MemoValueRenderer value={value.value} onChange={handleValueChange} />
      ) : null}
    </div>
  );
};

export const createConfigurableInputEditor = <
  T extends Record<string, unknown>
>(
  valueRenderer: React.FC<ValueCompProps<T>>
) => {
  return (props: Omit<ConfigurableInputEditorProps<T>, "valueRenderer">) => (
    <ConfigurableInputEditor {...props} valueRenderer={valueRenderer} />
  );
};
