import { Card, FormGroup, HTMLSelect, Switch } from "@blueprintjs/core";
import {
  InputPinConfig,
  InputPin,
  isStaticInputPinConfig,
  staticInputPinConfig,
  queueInputPinConfig,
  InputMode,
  stickyInputPinConfig,
  INPUT_MODES,
  InputPinMode,
} from "@flyde/core";
import Editor, { OnMount } from "@monaco-editor/react";
import React, { useEffect, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";

const STATIC_VALUE_CHANGE_DEBOUNCE = 400;

const inputModeTranslations: Record<InputMode, string> = {
  required: "Required",
  "required-if-connected": "Required only if connected",
  optional: "Optional",
};

const modeTranslations: Record<InputPinMode, string> = {
  static: "Static value",
  queue: "Dynamic value - queued",
  sticky: "Dynamic value - sticky",
};

const InputModeSelect: React.FC<{
  config: InputPinConfig;
  onChangeConfig: (config: InputPinConfig) => void;
}> = (props) => {
  const { config, onChangeConfig } = props;

  const selected = config.mode;

  const onChange = useCallback(
    (e: any) => {
      const mode = e.target.value;
      switch (mode) {
        case "static":
          onChangeConfig(staticInputPinConfig(""));
          break;
        case "queue":
          onChangeConfig(queueInputPinConfig());
          break;
        case "sticky":
          onChangeConfig(stickyInputPinConfig());
          break;
      }
    },
    [onChangeConfig]
  );

  const options = INPUT_MODES.map((v) => ({
    label: modeTranslations[v],
    value: v,
  }));
  return <HTMLSelect options={options} value={selected} onChange={onChange} />;
};

export type InstancePanelInputPinViewProps = {
  id: string;
  config: InputPinConfig;
  pin: InputPin;
  visible: boolean;

  connected: boolean;

  onToggleVisible: (id: string, visible: boolean) => void;
  onChangeConfig: (id: string, config: InputPinConfig) => void;
};

export const InstancePanelInputPinView: React.FC<
  InstancePanelInputPinViewProps
> = (props) => {
  const { id, config, pin, visible, onToggleVisible, onChangeConfig } = props;

  const mode = config.mode;

  const value = isStaticInputPinConfig(config) ? config.value : 42;

  const [editorValue, setEditorValue] = React.useState(JSON.stringify(value));
  const [invalid, setInvalid] = React.useState(false);

  useEffect(() => {
    // setEditorValue(JSON.stringify(value, null, 2));
  }, [value]);

  useEffect(() => {
    if (mode !== "static") {
      return;
    }

    try {
      // _onChangeStaticValue(JSON.parse(editorValue));
      setInvalid(false);
    } catch (e) {
      setInvalid(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorValue]);
  const onMonacoMount: OnMount = (editor) => {
    if (editor) {
      editor.updateOptions({
        lineNumbers: "off",
        minimap: { enabled: false },
      });
    }
  };
  const _onToggleVisible = useCallback(
    (e: any) => {
      onToggleVisible(id, e.target.checked);
    },
    [id, onToggleVisible]
  );

  const _onChangeConfig = useCallback(
    (config: InputPinConfig) => {
      onChangeConfig(id, config);
    },
    [id, onChangeConfig]
  );

  const _onChangeStaticValue = useDebouncedCallback((value: any) => {
    onChangeConfig(id, staticInputPinConfig(value));
  }, STATIC_VALUE_CHANGE_DEBOUNCE);

  const onChangeRawValue = useCallback(
    (value: string | undefined) => {
      setEditorValue(value || "");
      try {
        _onChangeStaticValue(JSON.parse(value || ""));
        setInvalid(false);
      } catch (e) {
        setInvalid(true);
      }
    },
    [_onChangeStaticValue]
  );

  if (!pin) {
    return <div>Error - No pin</div>;
  }

  const suffix = inputModeTranslations[pin.mode || "required"];

  const isDisabled =
    mode === "static"
      ? false
      : pin.mode === "required" ||
        (pin.mode === "required-if-connected" && props.connected && visible);

  return (
    <Card className="pin-view">
      <h5 className="bp5-heading">
        <span>{id}</span>{" "}
        <em>
          <small>{suffix}</small>
        </em>{" "}
        <Switch
          checked={visible}
          disabled={isDisabled}
          inline
          onChange={_onToggleVisible}
          innerLabel="Hidden"
          innerLabelChecked="Visible"
        />
      </h5>
      <FormGroup
        // helperText="Helper text with details..."
        label="Input mode:"
        inline
        // labelFor="text-input"
        // labelInfo="(required)"
      >
        <InputModeSelect
          config={config || queueInputPinConfig()}
          onChangeConfig={_onChangeConfig}
        />
      </FormGroup>

      {mode === "static" ? (
        <React.Fragment>
          <Editor
            height="80px"
            theme="vs-dark"
            defaultLanguage="plaintext"
            value={editorValue}
            onMount={onMonacoMount}
            onChange={onChangeRawValue}
          />
          {invalid ? <div className="error">Invalid JSON</div> : null}
        </React.Fragment>
      ) : null}
    </Card>
  );
};
