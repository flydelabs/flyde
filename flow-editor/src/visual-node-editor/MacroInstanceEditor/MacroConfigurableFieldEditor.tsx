import {
  Button,
  FormGroup,
  Menu,
  MenuItem,
  Popover,
  Position,
} from "@blueprintjs/core";
import {
  MacroConfigurableValue,
  MacroEditorFieldDefinition,
} from "@flyde/core";
import { MacroConfigurableValueBaseEditor } from "./MacroConfigurableValueBaseEditor";
import { useCallback, useMemo, useState } from "react";
import { convertValue } from "./convertValues";
import { Cog } from "@blueprintjs/icons";

export function MacroConfigurableFieldEditor(props: {
  value: MacroConfigurableValue;
  onChange: (value: MacroConfigurableValue) => void;
  config: MacroEditorFieldDefinition;
}) {
  const { config, value, onChange } = props;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const changeType = useCallback(
    (newType: MacroConfigurableValue["type"]) => {
      const newValue = convertValue(value.type, newType, value.value);
      onChange({ type: newType, value: newValue });
      setIsPopoverOpen(false);
    },
    [value, onChange]
  );

  const helperText = useMemo(() => {
    const isTemplateSupported =
      (value.type === "string" || value.type === "json") &&
      config.templateSupport !== false;

    return (
      <div className="config-helper-text">
        <span>
          {isTemplateSupported
            ? "Use {{ }} to insert variables. For example {{myVar}}"
            : ""}
        </span>
        {config.typeConfigurable !== false ? (
          <Popover
            content={
              <Menu>
                <MenuItem
                  text="Dynamic"
                  onClick={() => changeType("dynamic")}
                />
                <MenuItem text="Number" onClick={() => changeType("number")} />
                <MenuItem
                  text="Boolean"
                  onClick={() => changeType("boolean")}
                />
                <MenuItem text="JSON" onClick={() => changeType("json")} />
                <MenuItem text="String" onClick={() => changeType("string")} />
              </Menu>
            }
            position={Position.BOTTOM}
            isOpen={isPopoverOpen}
            onInteraction={setIsPopoverOpen}
            className="change-type-button-wrapper"
          >
            <Button minimal small rightIcon={<Cog />}>
              Change type
            </Button>
          </Popover>
        ) : null}
      </div>
    );
  }, [
    changeType,
    config.templateSupport,
    config.typeConfigurable,
    isPopoverOpen,
    value.type,
  ]);

  return (
    <div>
      <FormGroup label={`${config.label}:`} helperText={helperText}>
        <MacroConfigurableValueBaseEditor
          value={props.value}
          onChange={props.onChange}
          fieldDefinition={props.config}
        />
      </FormGroup>
    </div>
  );
}
