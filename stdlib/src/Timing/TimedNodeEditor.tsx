import { FormGroup, HTMLSelect, NumericInput } from "@blueprintjs/core";
import { MacroEditorComp } from "../lib/MacroEditorComp";
import { TimingNodeConfig } from "./Timing.flyde";
import React from "react";

export const TimedNodeEditor: MacroEditorComp<TimingNodeConfig> =
  function TimedNodeEditor(props) {
    const { value, onChange } = props;

    return (
      <>
        <FormGroup
          label="Time mode:"
          inline
          helperText="If dynamic mode is chosen, a new input pin will be exposed for the time value."
        >
          <HTMLSelect
            value={value.type}
            onChange={(e) =>
              onChange({
                ...value,
                type: e.target.value as any,
              })
            }
          >
            <option value="static">Static</option>
            <option value="dynamic">Dynamic (via input)</option>
          </HTMLSelect>
        </FormGroup>
        {value.type === "static" ? (
          <FormGroup label="Time (in milliseconds):" inline>
            <NumericInput
              value={value.timeMs}
              onValueChange={(e) => onChange({ ...value, timeMs: e })}
            />
          </FormGroup>
        ) : null}
      </>
    );
  };
