import {
  Checkbox,
  FormGroup,
  HTMLSelect,
  InputGroup,
  NumericInput,
} from "@blueprintjs/core";
import {
  MacroEditorComp,
  MacroEditorConfigStructured,
  MacroEditorFieldDefinition,
  MacroEditorFieldDefinitionType,
} from "@flyde/core";
import { SimpleJsonEditor } from "./SimpleJsonEditor";
import { ConfigurableInputEditor } from "./ConfigurableInputEditor";

export interface ValueCompProps<T> {
  value: T;
  onChange: (value: T) => void;
}

export function MacroEditorBaseValueComp(
  props: ValueCompProps<any> & { config: MacroEditorFieldDefinitionType }
) {
  switch (props.config.value) {
    case "number":
      return (
        <NumericInput
          value={props.value}
          onValueChange={(e) => props.onChange(e)}
        />
      );
    case "string":
      return (
        <InputGroup
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        />
      );
    case "json":
      return (
        <SimpleJsonEditor
          value={props.value}
          onChange={(e) => props.onChange(e)}
          label={props.config.label}
        />
      );
    case "boolean":
      return (
        <Checkbox checked={props.value} onChange={(e) => props.onChange(e)} />
      );
    case "select": {
      return (
        <HTMLSelect
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        >
          {props.config.items.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </HTMLSelect>
      );
    }
  }
}

export function MacroEditorFieldDefinitionRenderer(
  props: ValueCompProps<any> & { config: MacroEditorFieldDefinition }
) {
  const { config } = props;
  if (props.config.allowDynamic) {
    return (
      <ConfigurableInputEditor
        value={props.value}
        onChange={props.onChange}
        valueRenderer={(rendererProps) => (
          <FormGroup label={`${config.label}:`} inline>
            <MacroEditorBaseValueComp
              value={rendererProps.value}
              onChange={rendererProps.onChange}
              config={props.config.type}
            />
          </FormGroup>
        )}
        modeLabel={`${props.config.label} mode:`}
        defaultStaticValue={props.config.defaultValue}
      />
    );
  } else {
    return (
      <FormGroup label={`${config.label}:`} inline>
        <MacroEditorBaseValueComp
          value={props.value}
          onChange={props.onChange}
          config={props.config.type}
        />
      </FormGroup>
    );
  }
}

export function buildStructuredMacroEditorComp<T>(
  editorConfig: MacroEditorConfigStructured
): MacroEditorComp<T> {
  return (props) => {
    return (
      <>
        {editorConfig.fields.map((field) => (
          <MacroEditorFieldDefinitionRenderer
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
      </>
    );
  };
}
