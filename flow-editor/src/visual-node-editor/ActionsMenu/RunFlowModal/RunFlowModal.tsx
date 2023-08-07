import * as React from "react";

// ;

import Editor, { OnMount } from "@monaco-editor/react";
import { Button, Callout, Classes, Dialog, Intent } from "@blueprintjs/core";
import classNames from "classnames";
import { BaseNode } from "@flyde/core";
import { useLocalStorage } from "../../../lib/user-preferences";

export interface RunFlowModalProps {
  node: BaseNode;
  onRun: (inputs: Record<string, any>) => void;
  onClose: () => void;
}

export const RunFlowModal: React.FC<RunFlowModalProps> = React.memo(
  function RunFlowModal(props) {
    const { onRun, onClose, node } = props;

    const [lastValues, setLastValues] = useLocalStorage(
      `run-inputs-${node.id}`,
      Object.keys(node.inputs).reduce((acc, key) => {
        acc[key] = `Enter a value for input ${key}`;
        return acc;
      }, {})
    );

    const [value, setValue] = React.useState(
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
      const inputs = JSON.parse(value);
      setLastValues(inputs);
      onRun(inputs);
    }, [onRun, setLastValues, value]);

    const onKeyDown: React.KeyboardEventHandler<any> = (e) => {
      if (e.key === "Enter" && e.metaKey) {
        _onRun();
      }
    };

    const optionals = Object.keys(node.inputs).filter(
      (key) => node.inputs[key].mode !== "required"
    );

    return (
      <Dialog isOpen={true} onClose={props.onClose} className="run-flow-modal">
        <main
          className={classNames(Classes.DIALOG_BODY)}
          onKeyDown={onKeyDown}
          tabIndex={0}
        >
          <strong>
            This node receives external inputs. Enter values for each input
            below:
          </strong>

          <Editor
            height="80px"
            theme="vs-dark"
            defaultLanguage="json"
            value={value}
            onChange={(val) => setValue(val ?? "")}
            onMount={onMonacoMount}
          />

          {optionals.length > 0 ? (
            <Callout intent={Intent.NONE}>
              Note: input(s) <code>{optionals.join(", ")}</code> are optional
            </Callout>
          ) : null}
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
