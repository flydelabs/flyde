import { FormGroup, NumericInput, Radio, RadioGroup } from "@blueprintjs/core";
import { MacroEditorComp } from "@flyde/core";
import { CollectConfig } from "./Collect.flyde";

import React from "react";
import { ConfigurableInputEditor } from "../../lib/ConfigurableInputEditor";

const defaultValuePerStrategy: Record<
  CollectConfig["strategy"],
  CollectConfig
> = {
  count: {
    strategy: "count",
    count: { mode: "static", value: 2 },
  },
  time: {
    strategy: "time",
    time: { mode: "static", value: 2000 },
  },
  trigger: {
    strategy: "trigger",
  },
};

const CollectEditor: MacroEditorComp<CollectConfig> = function CollectEditor({
  value,
  onChange,
}) {
  const handleStrategyChange = React.useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const strategy = e.currentTarget.value as CollectConfig["strategy"];
      const defaultValue = defaultValuePerStrategy[strategy];
      onChange(defaultValue);
    },
    [onChange, value]
  );

  const innerEditor = React.useMemo(() => {
    switch (value.strategy) {
      case "count":
        return (
          <ConfigurableInputEditor
            value={value.count}
            onChange={(count) => onChange({ ...value, count })}
            valueRenderer={(props) => (
              <FormGroup label="Count:" inline>
                <NumericInput
                  value={props.value}
                  onValueChange={(e) =>
                    onChange({
                      ...value,
                      count: { mode: "static", value: e },
                    })
                  }
                />
              </FormGroup>
            )}
            modeLabel="Count mode:"
            defaultStaticValue={2}
          />
        );
      case "time":
        return (
          <ConfigurableInputEditor
            value={value.time}
            onChange={(time) => onChange({ ...value, time })}
            valueRenderer={(props) => (
              <FormGroup label="Time:" inline>
                <NumericInput
                  value={props.value}
                  onValueChange={(e) =>
                    onChange({
                      ...value,
                      time: { mode: "static", value: e },
                    })
                  }
                />
              </FormGroup>
            )}
            modeLabel="Time mode:"
            defaultStaticValue={2000}
          />
        );
    }
  }, [value, onChange]);

  return (
    <>
      <RadioGroup
        label="Collection strategy:"
        onChange={handleStrategyChange}
        selectedValue={value.strategy}
        inline
      >
        <Radio label="Count" value="count" />
        <Radio label="Time" value="time" />
        <Radio label="Dynamic" value="trigger" />
      </RadioGroup>
      {innerEditor}
    </>
  );
};

export default CollectEditor;
