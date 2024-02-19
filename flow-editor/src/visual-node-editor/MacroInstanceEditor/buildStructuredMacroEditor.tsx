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
import { ValueCompProps } from "./ValueCompProps";
import { SimpleJsonEditor } from "./SimpleJsonEditor";
import { ConfigurableInputEditor } from "./ConfigurableInputEditor";

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
    case "object":
      return (
        <SimpleJsonEditor
          value={props.value}
          onChange={(e) => props.onChange(e)}
          label={""}
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

// export const TimedNodeEditor: MacroEditorComp<TimingNodeConfig> =
//   function TimedNodeEditor(props) {
//     const { value, onChange } = props;

//     return (
//       <>
//         <FormGroup
//           label="Time mode:"
//           inline
//           helperText="If dynamic mode is chosen, a new input pin will be exposed for the time value."
//         >
//           <HTMLSelect
//             value={value.mode}
//             onChange={(e) =>
//               onChange({
//                 ...value,
//                 mode: e.target.value as any,
//               })
//             }
//           >
//             <option value="static">Static</option>
//             <option value="dynamic">Dynamic (via input)</option>
//           </HTMLSelect>
//         </FormGroup>
//         {value.mode === "static" ? (
//           <FormGroup label="Time (in milliseconds):" inline>
//             <NumericInput
//               value={value.timeMs}
//               onValueChange={(e) => onChange({ ...value, timeMs: e })}
//             />
//           </FormGroup>
//         ) : null}
//       </>
//     );
//   };

// const IntervalEditor: MacroEditorComp<IntervalConfig> =
//   function IntervalEditor({ value, onChange }) {
//     return (
//       <>
//         <ConfigurableInputEditor
//           value={value.time}
//           onChange={(time) => onChange({ ...value, time })}
//           valueRenderer={(rendererProps) => (
//             <FormGroup label="Time (in milliseconds):" inline>
//               <NumericInput
//                 value={rendererProps.value.timeMs}
//                 onValueChange={(number) =>
//                   rendererProps.onChange({ timeMs: number })
//                 }
//               />
//             </FormGroup>
//           )}
//           modeLabel="Interval mode:"
//           defaultStaticValue={{ timeMs: 2000 }}
//         />

//         <ConfigurableInputEditor
//           value={value.value}
//           onChange={(_value) => onChange({ ...value, value: _value })}
//           valueRenderer={(rendererProps) => (
//             <FormGroup label="Value:" inline>
//               <SimpleJsonEditor
//                 value={rendererProps.value.jsonValue}
//                 onChange={(jsonValue) => rendererProps.onChange({ jsonValue })}
//                 label=""
//               />
//             </FormGroup>
//           )}
//           modeLabel="Value mode:"
//           defaultStaticValue={{ jsonValue: "" }}
//         />
//       </>
//     );
//   };
