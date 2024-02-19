import React from "react";
import { FormGroup, HTMLSelect } from "@blueprintjs/core";
import { MacroEditorComp } from "@flyde/core";

const MAX_ITEMS = 6;

const SplitListEditor: MacroEditorComp<number> = function SplitListEditor(
  props
) {
  return (
    <FormGroup label="Items count:" inline>
      <HTMLSelect
        value={props.value.toString()}
        onChange={(e) => props.onChange(parseInt(e.target.value))}
      >
        {Array.from({ length: MAX_ITEMS - 1 }, (_, index) => (
          <option key={index + 2} value={index + 2}>
            {index + 2}
          </option>
        ))}
      </HTMLSelect>
    </FormGroup>
  );
};

export default SplitListEditor;
