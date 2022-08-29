import {
  Dialog,
  Classes,
  Button,
  RadioGroup,
  Radio,
  Divider,
  Checkbox,
  NumericInput,
  TextArea,
  Callout,
  Intent,
  Code,
  Menu,
  MenuItem,
} from "@blueprintjs/core";
import classNames from 'classnames';
import React, { useState } from "react";

// ;
import Editor, { OnMount } from "@monaco-editor/react";
import { ExecuteEnv, getEnvKeyFromValue, isDefined, isEnvValue, OMap } from "@flyde/core";
import { Popover2 } from "@blueprintjs/popover2";

export type ValueBuilderType = "string" | "object" | "number" | "boolean" | "env";

export interface ValueBuilderViewProps {
  env: ExecuteEnv;
  initialValue?: any;
  onSubmit: (v: any, type: ValueBuilderType) => void;
  onCancel: () => void;
  hideTemplatingTips: boolean;
}

const preProcessValue = (value: any, type: ValueBuilderType) => {
  switch (type) {
    case "env":
      return getEnvKeyFromValue(value);
    case "object":
      return JSON.stringify(value, null, 2);
    default:
      return value;
  }
};

const defaultValues = {
  boolean: true,
  string: "",
  number: 42,
  // formula: "0.5 * (${price} + 17)",
  object: preProcessValue({ name: "Yorai", age: 9 }, "object"),
  env: "",
};

const inferDataType = (val: any): ValueBuilderType => {
  const t = typeof val;
  switch (t) {
    case "string": {
      if (isEnvValue(val)) {
        return "env";
      } else {
        return "string";
      }
    }
    case "object":
    case "number":
    case "boolean":
      return t;
    default:
      throw new Error("Unsupported data type!");
  }
};

const postProcessValue = (value: any, type: ValueBuilderType) => {
  switch (type) {
    case "env":
      // TODO - check if env exists;
      return `$ENV.${value}`;
    case "object":
      try {
        return JSON.parse(value);
      } catch (e) {
        throw new Error(`Invalid object`);
      }
    default:
      return value;
  }
};

export const ValueBuilderView: React.FC<ValueBuilderViewProps> = (props) => {
  const { onSubmit, initialValue } = props;
  const [dataType, setDataType] = useState<ValueBuilderType>(inferDataType(initialValue));

  const ppInitial = preProcessValue(initialValue, dataType);

  const [value, setValue] = useState<any>(
    isDefined(initialValue) ? ppInitial : defaultValues[dataType]
  );

  const onMonacoMount: OnMount = (editor) => {
    if (editor) {
      editor.updateOptions({
        lineNumbers: "off",
        minimap: { enabled: false },
      });
    }
  };

  const onChangeDataType = (type: keyof typeof defaultValues) => {
    if (type !== dataType) {
      setDataType(type as any);
      setValue(defaultValues[type]);
    }
  };

  const renderInner = () => {
    switch (dataType) {
      case "boolean": {
        return (
          <Checkbox
            checked={value}
            label={`Value: ${value}`}
            onChange={(e) => setValue((e.target as any).checked)}
          />
        );
      }
      case "number":
        return (
          <NumericInput
            value={value}
            onValueChange={setValue}
            allowNumericCharactersOnly={false}
            autoFocus
          />
        );
      case "string":
        return (
          <TextArea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            growVertically
            fill
            autoFocus
          />
        );
      case "object":
        return (
          <Editor
            value={value}
            onChange={(v) => setValue(v || "")}
            theme="vscode-dark"
            language="json"
            height="180px"
            onMount={onMonacoMount}
          />
        );
      case "env":
        if (Object.keys(props.env).length === 0) {
          return (
            <Callout intent={Intent.WARNING}>
              You have no environment variables set up. Use the header menu to set one up
            </Callout>
          );
        }

        const renderMenuItems = (obj: OMap<any>, parent = "") => {
          return Object.keys(obj).map((key) => {
            const isObj = typeof obj[key] === "object";
            const path = `${parent}${parent ? "." : ""}${key}`;
            return (
              <MenuItem text={key} onClick={() => setValue(path)}>
                {isObj ? renderMenuItems(obj[key], path) : null}
              </MenuItem>
            );
          });
        };

        const menu = <Menu>{renderMenuItems(props.env)}</Menu>;

        return (
          <div>
            <Popover2 content={menu}>
              <Button text={value || "Choose ENV variable"} />
            </Popover2>
            <Callout intent={Intent.NONE}>Edit environment variable from the header menu</Callout>
          </div>
        );
      default:
        return "not yet";
    }
  };

  const maybeRenderTip = () => {
    if (props.hideTemplatingTips) {
      return null;
    }

    switch (dataType) {
      case "string":
        return (
          <div className="value-builder-tip">
            <br />
            <Callout intent={Intent.PRIMARY}>
              Add variables as <Code>{"${thisOne}"}</Code> or <Code>{"${anotherOne}"}</Code> to
              create a dynamid value builder.
            </Callout>
          </div>
        );
      case "object": {
        return (
          <div className="value-builder-tip">
            <br />
            <Callout intent={Intent.PRIMARY}>
              Add variables as <Code>{"${thisOne}"}</Code> or <Code>{"${anotherOne}"}</Code> to
              create a dynamic value builder. To embed a boolean/number/object inside a property,
              you can use <Code>{"$${anObjectHere}"}</Code>
            </Callout>
          </div>
        );
      }
    }
  };

  const onKeyDown: React.KeyboardEventHandler<any> = (e) => {
    if (e.key === "Enter" && e.metaKey) {
      props.onSubmit(value, dataType);
    }
  };

  const _onSubmit = React.useCallback(() => {
    try {
      const ppValue = postProcessValue(value, dataType);
      onSubmit(ppValue, dataType);
    } catch (e) {
      console.error(`Error parsing value: ${e}`);
      alert("Something went wrong. Check the console for more info.");
    }
  }, [value, dataType, onSubmit]);

  return (
    <div className="value-builder-view">
      <Dialog
        isOpen={true}
        title={"Value Builder"}
        onClose={props.onCancel}
        canEscapeKeyClose={false}
        className="value-builder-view"
      >
        <main className={classNames(Classes.DIALOG_BODY)} onKeyDown={onKeyDown} tabIndex={0}>
          <RadioGroup
            label="Data type:"
            inline
            onChange={(e) => onChangeDataType((e.target as HTMLInputElement).value as any)}
            selectedValue={dataType}
          >
            <Radio label="Boolean" value="boolean" />
            <Radio label="Number" value="number" />
            <Radio label="String" value="string" />
            <Radio label="Object" value="object" />
            <Radio label="Env" value="env" />
          </RadioGroup>
          <Divider />

          <div className="value-builder-inner">{renderInner()}</div>
          {maybeRenderTip()}

          {/* {objError ? <Callout intent={Intent.DANGER}>Invalid Object!</Callout> : null} */}
        </main>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={props.onCancel}>Cancel</Button>
            <Button onClick={_onSubmit} intent={Intent.PRIMARY} className="save-btn">
              Save
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
