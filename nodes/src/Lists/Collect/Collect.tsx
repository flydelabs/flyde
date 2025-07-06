import { ConfigurableEditorComp } from "@flyde/core";
import { CollectConfig } from "./Collect.flyde";
import { FormGroup, NumericInput, RadioGroup, RadioGroupItem } from "@flyde/editor";

import React from "react";
import { ConfigurableInputEditor } from "@flyde/editor";

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

const CollectEditor: ConfigurableEditorComp<CollectConfig> = function CollectEditor({
  value,
  onChange,
}) {
  const handleStrategyChange = React.useCallback(
    (value: string) => {
      const strategy = value as CollectConfig["strategy"];
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
                  style={{ width: 80 }}
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
                  style={{ width: 80 }}
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "1rem" }}>
        <RadioGroup value={value.strategy} onValueChange={handleStrategyChange}>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <RadioGroupItem value="count" id="count" />
              <label htmlFor="count">Count</label>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <RadioGroupItem value="time" id="time" />
              <label htmlFor="time">Time</label>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <RadioGroupItem value="trigger" id="trigger" />
              <label htmlFor="trigger">Dynamic</label>
            </div>
          </div>
        </RadioGroup>
      </div>
      {innerEditor}
    </div>
  );
};

export default CollectEditor;
