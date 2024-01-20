import * as React from "react";

// ;

import Editor, { OnMount } from "@monaco-editor/react";
import {
  Button,
  Callout,
  Classes,
  Dialog,
  Intent,
  Slider,
} from "@blueprintjs/core";
import classNames from "classnames";
import { BaseNode } from "@flyde/core";
import { useLocalStorage } from "../../lib/user-preferences";
import { InfoTooltip } from "../../lib/InfoTooltip";
import { usePorts } from "../../flow-editor/ports";

export interface RunFlowModalProps {
  node: BaseNode;
  onClose: () => void;
}

export const RunFlowModal: React.FC<RunFlowModalProps> = React.memo(
  function RunFlowModal(props) {
    const { onClose, node } = props;

    const { onRunFlow } = usePorts();

    const [executionDelay, setExecutionDelay] = React.useState(0);

    const [lastValues, setLastValues] = useLocalStorage(
      `run-inputs-${node.id}`,
      Object.keys(node.inputs).reduce((acc, key) => {
        acc[key] = `Enter a value for input ${key}`;
        return acc;
      }, {})
    );

    const [inputsValue, setInputsValue] = React.useState(
      JSON.stringify(lastValues, null, 2)
    );

    const onMonacoMount: OnMount = (editor) => {
      if (editor) {
        editor.updateOptions({
          lineNumbers: "off",
          minimap: { enabled: false },
        });
      }
    };

    const _onRun = React.useCallback(() => {
      const inputs = JSON.parse(inputsValue);
      setLastValues(inputs);
      onRunFlow(inputs, executionDelay);
      onClose();
    }, [inputsValue, setLastValues, onRunFlow, executionDelay, onClose]);

    const onKeyDown: React.KeyboardEventHandler<any> = (e) => {
      if (e.key === "Enter" && e.metaKey) {
        _onRun();
      }
    };

    const flowInputs = Object.keys(node.inputs);

    const optionals = flowInputs.filter(
      (key) => node.inputs[key].mode !== "required"
    );

    const maybeInputs = React.useMemo(() => {
      if (flowInputs.length) {
        return (
          <>
            <strong>
              This node receives external inputs. Enter values for each input
              below:
            </strong>

            <Editor
              height="80px"
              theme="vs-dark"
              defaultLanguage="json"
              value={inputsValue}
              onChange={(val) => setInputsValue(val ?? "")}
              onMount={onMonacoMount}
            />

            {optionals.length > 0 ? (
              <Callout intent={Intent.NONE}>
                Note: input(s) <code>{optionals.join(", ")}</code> are optional
              </Callout>
            ) : null}
          </>
        );
      } else {
        return <strong>This node does not receive any external inputs.</strong>;
      }
    }, [flowInputs.length, optionals, inputsValue]);

    return (
      <Dialog isOpen={true} onClose={props.onClose} className="run-flow-modal">
        <main
          className={classNames(Classes.DIALOG_BODY)}
          onKeyDown={onKeyDown}
          tabIndex={0}
        >
          {maybeInputs}
          <div className="execution-delay-wrapper">
            <label>
              Execution delay:{" "}
              <InfoTooltip content="Delay between each node execution. Useful for debugging." />
            </label>
            <Slider
              value={executionDelay}
              onChange={setExecutionDelay}
              min={0}
              labelStepSize={500}
              stepSize={100}
              labelRenderer={(val) => `${val}ms`}
              max={1000}
            />
          </div>
        </main>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={onClose}>Close</Button>
            <Button
              onClick={_onRun}
              intent={Intent.PRIMARY}
              className="run-btn"
            >
              Run
            </Button>
          </div>
        </div>
      </Dialog>
    );
  }
);
