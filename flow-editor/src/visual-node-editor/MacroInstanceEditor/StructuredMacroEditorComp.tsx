import { MacroEditorComp, MacroEditorConfigStructured } from "@flyde/core";
import { MacroConfigurableFieldEditor } from "./MacroConfigurableFieldEditor";

export function StructuredMacroEditorComp<T>(
  editorConfig: MacroEditorConfigStructured
): MacroEditorComp<T> {
  return (props) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {editorConfig.fields.map((field) => (
          <MacroConfigurableFieldEditor
            key={field.configKey}
            value={props.value[field.configKey]}
            onChange={(newValue) =>
              props.onChange({
                ...props.value,
                [field.configKey]: newValue,
              })
            }
            config={field}
          />
        ))}
      </div>
    );
  };
}
