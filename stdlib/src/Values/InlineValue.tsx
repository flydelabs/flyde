import type { InlineValueConfig } from "./InlineValue.flyde";
import React from "react";
import { MacroEditorComp } from "@flyde/core";
import { MacroConfigurableFieldEditor } from "@flyde/flow-editor";

const InlineValueEditor: MacroEditorComp<InlineValueConfig> =
  function InlineValueEditor(props) {
    const { value, onChange } = props;

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
        />
      </div>
    );
  };

export default InlineValueEditor;
