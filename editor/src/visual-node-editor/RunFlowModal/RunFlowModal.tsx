import * as React from "react";

// ;

import Editor, { OnMount } from "@monaco-editor/react";
import { BaseNode } from "@flyde/core";
import { useLocalStorage } from "../../lib/user-preferences";
import { InfoTooltip } from "../../lib/InfoTooltip";
import { usePorts } from "../../flow-editor/ports";
import { Button } from "../../ui";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "../../ui";
import { Slider } from "../../ui";
import { cn } from "../../lib/utils";

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
      }, {} as Record<string, string>)
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
      (key) => node.inputs[key]?.mode !== "required"
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
              <div className="rounded-md border border-muted bg-muted/50 p-4 text-sm text-muted-foreground">
                Note: input(s) <code>{optionals.join(", ")}</code> are optional
              </div>
            ) : null}
          </>
        );
      } else {
        return <strong>This node does not receive any external inputs.</strong>;
      }
    }, [flowInputs.length, optionals, inputsValue]);

    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="space-y-4" onKeyDown={onKeyDown} tabIndex={0}>
              {maybeInputs}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">
                    Execution delay:
                  </label>
                  <InfoTooltip content="Delay between each node execution. Useful for debugging." />
                </div>
                <Slider
                  value={[executionDelay]}
                  onValueChange={([value]) => setExecutionDelay(value ?? 0)}
                  min={0}
                  max={1000}
                  step={100}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  {executionDelay}ms
                </div>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={_onRun}>Run</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);
