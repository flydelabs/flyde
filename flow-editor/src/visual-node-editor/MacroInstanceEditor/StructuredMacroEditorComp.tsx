import {
  macroConfigurableValue,
  MacroEditorComp,
  MacroEditorConfigStructured,
} from "@flyde/core";
import { MacroConfigurableFieldEditor } from "@flyde/stdlib";
import { usePrompt } from "../../flow-editor/ports";

export function StructuredMacroEditorComp<T>(
  editorConfig: MacroEditorConfigStructured
): MacroEditorComp<T> {
  return (props) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const prompt = usePrompt();
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {editorConfig.fields.map((field) => (
          <MacroConfigurableFieldEditor
            key={field.configKey}
            value={
              props.value[field.configKey] ??
              macroConfigurableValue("dynamic", "")
            }
            onChange={(newValue) =>
              props.onChange({
                ...props.value,
                [field.configKey]: newValue,
              })
            }
            prompt={prompt}
            config={field}
          />
        ))}
      </div>
    );
  };
}
