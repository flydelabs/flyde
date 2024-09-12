import { Radio, RadioGroup } from "@blueprintjs/core";
import React from "react";
import { ConfigurableInput } from "@flyde/core";
import { InfoTooltip } from "../../lib/InfoTooltip";

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
  const handleModeChange = (e: React.FormEvent<HTMLInputElement>) => {
    onChange({
      mode: e.currentTarget.value as "static" | "dynamic",
      value:
        e.currentTarget.value === "static" ? defaultStaticValue : undefined,
    });
  };

  const handleValueChange = (value: T) => {
    onChange({
      value,
      mode: "static",
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const MemoValueRenderer = React.useMemo(() => ValueRenderer, []);
  return (
    <>
      <RadioGroup
        label={
          <span className="macro-label-container">
            <span>{modeLabel}</span>
            <InfoTooltip
              content={
                <div>
                  <strong>Static</strong> - can be configured with a fixed
                  value, using this form
                  <br />
                  <strong>Dynamic</strong> - a new input will be exposed so this
                  value can be controlled at runtime
                </div>
              }
            />
          </span>
        }
        onChange={handleModeChange}
        selectedValue={value.mode}
        inline
      >
        <Radio label="Static" value="static" />
        <Radio label="Dynamic" value="dynamic" />
      </RadioGroup>
      {value.mode === "static" ? (
        <MemoValueRenderer value={value.value} onChange={handleValueChange} />
      ) : null}
    </>
  );
};

export const createConfigurableInputEditor = <T extends Record<string, any>>(
  valueRenderer: React.FC<ValueCompProps<T>>
) => {
  return (props: Omit<ConfigurableInputEditorProps<T>, "valueRenderer">) => (
    <ConfigurableInputEditor {...props} valueRenderer={valueRenderer} />
  );
};
