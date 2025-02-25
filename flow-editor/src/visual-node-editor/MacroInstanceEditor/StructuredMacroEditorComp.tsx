import {
  macroConfigurableValue,
  MacroEditorComp,
  MacroEditorConfigStructured,
  evaluateCondition,
} from "@flyde/core";
import { MacroConfigurableFieldEditor } from "@flyde/stdlib";
import { usePrompt } from "../../flow-editor/ports";
import { useState } from "react";

// Helper function for non-configurable dropdown/select field
function NonConfigurableSelectField({
  value,
  onChange,
  config,
}: {
  value: any;
  onChange: (value: any) => void;
  config: any;
}) {
  const options = config.typeData?.options || [];

  const renderOptions = () => {
    if (Array.isArray(options) && options.length > 0) {
      // Handle array of objects with value/label
      if (typeof options[0] === "object" && "value" in options[0]) {
        return options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ));
      }
      // Handle array of strings
      return options.map((opt: string) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ));
    }
    return null;
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ marginBottom: "4px", fontWeight: 500 }}>{config.label}</div>
      {config.description && (
        <div style={{ marginBottom: "8px", color: "#888", fontSize: "0.85em" }}>
          {config.description}
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          backgroundColor: "#fff",
        }}
      >
        {renderOptions()}
      </select>
    </div>
  );
}

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
  prompt: (message: string) => Promise<string>;
}) {
  const [isCollapsed, setIsCollapsed] = useState(
    group.typeData?.defaultCollapsed ?? false
  );

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

            // Use a different editor for non-configurable select fields
            if (field.configurable === false && field.type === "select") {
              return (
                <NonConfigurableSelectField
                  key={field.configKey}
                  value={value[field.configKey]}
                  onChange={(newValue) =>
                    onChange({
                      ...value,
                      [field.configKey]: newValue,
                    })
                  }
                  config={field}
                />
              );
            }

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
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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

          // Use a different editor for non-configurable select fields
          if (field.configurable === false && field.type === "select") {
            return (
              <NonConfigurableSelectField
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
            );
          }

          return (
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
          );
        })}
      </div>
    );
  };
}
