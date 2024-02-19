import React from "react";
import { ConfigurableInputEditor } from "../../lib/ConfigurableInputEditor";
import { MacroEditorComp } from "@flyde/core";

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
          valueRenderer={(rendererProps) => (
            <FormGroup label="Time (in milliseconds):" inline>
              <NumericInput
                value={rendererProps.value.timeMs}
                onValueChange={(number) =>
                  rendererProps.onChange({ timeMs: number })
                }
              />
            </FormGroup>
          )}
          modeLabel="Interval mode:"
          defaultStaticValue={{ timeMs: 2000 }}
        />

        <ConfigurableInputEditor
          value={value.value}
          onChange={(_value) => onChange({ ...value, value: _value })}
          valueRenderer={(rendererProps) => (
            <FormGroup label="Value:" inline>
              <SimpleJsonEditor
                value={rendererProps.value.jsonValue}
                onChange={(jsonValue) => rendererProps.onChange({ jsonValue })}
                label=""
              />
            </FormGroup>
          )}
          modeLabel="Value mode:"
          defaultStaticValue={{ jsonValue: "" }}
        />
      </>
    );
  };

export default IntervalEditor;
