import {
  macroConfigurableValue,
  MacroEditorComp,
  MacroEditorConfigStructured,
  evaluateCondition,
  MacroConfigurableValue,
} from "@flyde/core";
import { MacroConfigurableFieldEditor } from "@flyde/stdlib";
import { usePrompt } from "../../flow-editor/ports";
import { useState } from "react";

// Define the GroupFieldDefinition type
interface GroupFieldDefinition {
  type: "group";
  configKey: string;
  label: string;
  description?: string;
  condition?: string;
  fields: any[]; // Using any[] to avoid typing issues
  typeData?: {
    collapsible?: boolean;
    defaultCollapsed?: boolean;
  };
}

// Type guard to check if a field is a group
function isGroupField(field: any): field is GroupFieldDefinition {
  return field && field.type === "group" && Array.isArray(field.fields);
}

// Helper function to evaluate field visibility based on its condition
function evaluateFieldVisibility(field: any, value: any): boolean {
  if (field.condition) {
    return evaluateCondition(field.condition, value);
  }
  return true;
}

// Component to render a group of fields
function GroupFields({
  group,
  value,
  onChange,
  prompt,
}: {
  group: GroupFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  prompt: (message: string) => Promise<string | null>;
}) {
  const [isCollapsed, setIsCollapsed] = useState(
    group.typeData?.defaultCollapsed ?? false
  );

  console.log("group", group, value, evaluateFieldVisibility(group, value));

  // Only render if the group's condition is met
  if (!evaluateFieldVisibility(group, value)) {
    return null;
  }

  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: group.typeData?.collapsible ? "pointer" : "default",
          color: "#666",
          fontSize: "0.9em",
          fontWeight: "500",
          paddingBottom: "4px",
          marginBottom: "8px",
        }}
        onClick={() => {
          if (group.typeData?.collapsible) {
            setIsCollapsed(!isCollapsed);
          }
        }}
      >
        <div>{group.label}</div>
        {group.typeData?.collapsible && (
          <div style={{ fontSize: "0.8em" }}>
            {isCollapsed ? "▼ Show" : "▲ Hide"}
          </div>
        )}
      </div>

      {group.description && (
        <div
          style={{
            marginBottom: "8px",
            color: "#888",
            fontSize: "0.85em",
          }}
        >
          {group.description}
        </div>
      )}

      {!isCollapsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {group.fields.map((field: any) => {
            // Check if the field is a group
            if (isGroupField(field)) {
              return (
                <GroupFields
                  key={field.configKey}
                  group={field}
                  value={value}
                  onChange={onChange}
                  prompt={prompt}
                />
              );
            }

            // Check if the field should be visible
            if (!evaluateFieldVisibility(field, value)) {
              return null;
            }

            // Use MacroConfigurableFieldEditor for all fields
            return (
              <MacroConfigurableFieldEditor
                key={field.configKey}
                value={
                  value[field.configKey] ??
                  macroConfigurableValue("dynamic", "")
                }
                onChange={(newValue) =>
                  onChange({
                    ...value,
                    [field.configKey]: newValue,
                  })
                }
                prompt={prompt}
                config={field}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StructuredMacroEditorComp<T>(
  editorConfig: MacroEditorConfigStructured
): MacroEditorComp<T> {
  return (props) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const prompt = usePrompt();

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {editorConfig.fields.map((field: any) => {
          // Check if the field is a group
          if (isGroupField(field)) {
            return (
              <GroupFields
                key={field.configKey}
                group={field}
                value={props.value}
                onChange={props.onChange}
                prompt={prompt}
              />
            );
          }

          // Check if the field has a condition and evaluate it
          if (!evaluateFieldVisibility(field, props.value)) {
            return null;
          }

          const configValue: Record<string, MacroConfigurableValue> = props.value && typeof props.value === "object" ? props.value : {};


          const value = configValue[field.configKey] ?? macroConfigurableValue("dynamic", "");

          // Use MacroConfigurableFieldEditor for all fields
          return (
            <MacroConfigurableFieldEditor
              key={field.configKey}
              value={value}
              onChange={(newValue) =>
                props.onChange({
                  ...props.value,
                  [field.configKey]: newValue,
                })
              }
              prompt={prompt}
              config={field}
            />
          );
        })}
      </div>
    );
  };
}
