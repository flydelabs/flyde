import React from "react";
import { ConfigurableInputEditor } from "../../lib/ConfigurableInputEditor";
import { MacroEditorComp } from "../../lib/MacroEditorComp";

import { FormGroup, NumericInput } from "@blueprintjs/core";
import { IntervalConfig } from "./Interval.flyde";
import { SimpleJsonEditor } from "../../lib/SimpleJsonEditor";

const IntervalEditor: MacroEditorComp<IntervalConfig> =
  function IntervalEditor({ value, onChange }) {
    return (
      <>
        <ConfigurableInputEditor
          value={value.time}
          onChange={(time) => onChange({ ...value, time })}
          valueRenderer={(props) => (
            <FormGroup label="Time (in milliseconds):" inline>
              <NumericInput
                value={props.value.timeMs}
                onValueChange={(e) => props.onChange({ ...value, timeMs: e })}
              />
            </FormGroup>
          )}
          modeLabel="Interval mode:"
          defaultStaticValue={{ timeMs: 2000 }}
        />

        <ConfigurableInputEditor
          value={value.value}
          onChange={(_value) => onChange({ ...value, value: _value })}
          valueRenderer={(props) => (
            <FormGroup label="Value:" inline>
              <SimpleJsonEditor
                value={props.value.value}
                onChange={(newValue) =>
                  props.onChange({ ...value, value: newValue })
                }
                label=""
              />
            </FormGroup>
          )}
          modeLabel="Value mode:"
          defaultStaticValue={{ value: "" }}
        />
      </>
    );
  };

export default IntervalEditor;
