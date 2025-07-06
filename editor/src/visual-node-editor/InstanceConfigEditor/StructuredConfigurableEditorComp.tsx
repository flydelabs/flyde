import {
  configurableValue,
  ConfigurableEditorComp,
  ConfigurableEditorConfigStructured,
  evaluateCondition,
  ConfigurableValue,
  PartialEditorPorts,
} from "@flyde/core";
import { ConfigurableFieldEditor } from "../../ui";
import { usePorts } from "../../flow-editor/ports";
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
  ports,
  nodeId,
  insId
}: {
  group: GroupFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  ports: PartialEditorPorts;
  nodeId: string;
  insId?: string;
}) {
  const [isCollapsed, setIsCollapsed] = useState(
    group.typeData?.defaultCollapsed ?? false
  );
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
                  ports={ports}
                  nodeId={nodeId}
                  insId={insId}
                />
              );
            }

            // Check if the field should be visible
            if (!evaluateFieldVisibility(field, value)) {
              return null;
            }

            // Use ConfigurableFieldEditor for all fields
            return (
              <ConfigurableFieldEditor
                key={field.configKey}
                value={
                  value[field.configKey] ??
                  configurableValue("dynamic", "")
                }
                onChange={(newValue) =>
                  onChange({
                    ...value,
                    [field.configKey]: newValue,
                  })
                }
                ports={ports}
                config={field}
                nodeId={nodeId}
                insId={insId}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StructuredConfigurableEditorComp<T>(
  editorConfig: ConfigurableEditorConfigStructured
): ConfigurableEditorComp<T> {
  return (props) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ports = usePorts();

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
                ports={ports}
                nodeId={props.nodeId}
                insId={props.insId}
              />
            );
          }

          // Check if the field has a condition and evaluate it
          if (!evaluateFieldVisibility(field, props.value)) {
            return null;
          }

          const configValue: Record<string, ConfigurableValue> = props.value && typeof props.value === "object" ? props.value : {};


          const value = configValue[field.configKey] ?? configurableValue("dynamic", "");

          // Use ConfigurableFieldEditor for all fields
          return (
            <ConfigurableFieldEditor
              key={field.configKey}
              value={value}
              onChange={(newValue) =>
                props.onChange({
                  ...props.value,
                  [field.configKey]: newValue,
                })
              }
              config={field}
              ports={ports}
              nodeId={props.nodeId}
              insId={props.insId}
            />
          );
        })}
      </div>
    );
  };
}
