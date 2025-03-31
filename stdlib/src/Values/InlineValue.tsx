import type { InlineValueConfig } from "./InlineValue.flyde";
import React from "react";
import { MacroEditorComp } from "@flyde/core";
import { MacroConfigurableFieldEditor } from "../lib/MacroConfigurableFieldEditor/MacroConfigurableFieldEditor";

const InlineValueEditor: MacroEditorComp<InlineValueConfig> =
  function InlineValueEditor(props) {
    const { value, onChange, ports } = props;

    return (
      <div>
        <MacroConfigurableFieldEditor
          value={value.value}
          onChange={(newVal) => onChange({ value: newVal })}
          config={{
            type: "string",
            label: "Value",
            configKey: "value",
          }}
          ports={ports}
        />
      </div>
    );
  };

export default InlineValueEditor;
