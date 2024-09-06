import { Menu, MenuDivider, MenuItem } from "@blueprintjs/core";
import { isDefined, preventDefaultAnd } from "../../utils";
import {
  NodeStyle,
  PinType,
  VisualNode,
  nodeInput,
  nodeOutput,
} from "@flyde/core";
import produce from "immer";
import React from "react";
import { usePrompt, AppToaster, usePorts, toastMsg } from "../..";
import { functionalChange } from "../../flow-editor/flyde-flow-change-type";
import { NodeStyleMenu } from "../instance-view/NodeStyleMenu";
import { VisualNodeEditorProps } from "../VisualNodeEditor";

export interface EditorContextMenuProps {
  nodeIoEditable: boolean;
  node: VisualNode;
  onChangeNode: VisualNodeEditorProps["onChangeNode"];
  lastMousePos: React.RefObject<{ x: number; y: number }>;
}

export function EditorContextMenu(props: EditorContextMenuProps) {
  const { nodeIoEditable, node, onChangeNode: onChange, lastMousePos } = props;
  const maybeDisabledLabel = nodeIoEditable
    ? ""
    : " (cannot edit main node, only visual)";

  const _prompt = usePrompt();

  const { reportEvent } = usePorts();

  const editCompletionOutputs = React.useCallback(async () => {
    const curr = node.completionOutputs?.join(",");
    const newVal = await _prompt(`Edit completion outputs`, curr);
    if (isDefined(newVal) && newVal !== null) {
      const newValue = produce(node, (draft) => {
        draft.completionOutputs = newVal === "" ? undefined : newVal.split(",");
      });

      onChange(newValue, functionalChange("change node completions"));
      reportEvent("editCompletionOutputs", {
        count: newVal ? newVal.split(",").length : 0,
      });
    }
  }, [_prompt, onChange, node, reportEvent]);

  const editReactiveInputs = React.useCallback(async () => {
    const curr = node.reactiveInputs?.join(",");
    const newVal = await _prompt(`Edit reactive inputs`, curr);
    if (isDefined(newVal) && newVal !== null) {
      const newValue = produce(node, (draft) => {
        draft.reactiveInputs = newVal === "" ? undefined : newVal.split(",");
      });

      onChange(newValue, functionalChange("change reactive inputs"));
      reportEvent("editReactiveInputs", {
        count: newVal ? newVal.split(",").length : 0,
      });
    }
  }, [_prompt, onChange, node, reportEvent]);

  const editNodeDescription = React.useCallback(async () => {
    const description = await _prompt(`Description?`, node.description);
    const newValue = produce(node, (draft) => {
      draft.description = description;
    });

    onChange(newValue, functionalChange("Edit node description"));
  }, [_prompt, onChange, node]);

  const onChangeDefaultStyle = React.useCallback(
    (style: NodeStyle) => {
      const newNode = produce(node, (draft) => {
        draft.defaultStyle = style;
      });
      onChange(newNode, functionalChange("change default style"));
      reportEvent("changeStyle", { isDefault: true });
    },
    [onChange, node, reportEvent]
  );

  const copyNodeToClipboard = React.useCallback(async () => {
    const str = JSON.stringify(node);
    await navigator.clipboard.writeText(str);
    AppToaster.show({ message: "Copied!" });
  }, [node]);

  const onAddMainPin = React.useCallback(
    async (type: PinType) => {
      const newPinId = await _prompt(`New ${type} pin name?`);
      if (!newPinId) {
        // name selection dismissed, cancelling
        return;
      }

      const newValue = produce(node, (draft) => {
        if (type === "input") {
          if (!node.inputs) {
            draft.inputs = {};
          }
          draft.inputs[newPinId] = nodeInput();
          draft.inputsPosition[newPinId] = lastMousePos.current;
        } else {
          if (!node.outputs) {
            draft.outputs = {};
          }
          draft.outputs[newPinId] = nodeOutput();
          draft.outputsPosition[newPinId] = lastMousePos.current;

          if (draft.completionOutputs?.length) {
            toastMsg(
              "Note that this node has explicit completion outputs set. You may need to update them."
            );
          }
        }
      });

      onChange(newValue, functionalChange("add new io pin"));
      reportEvent("addIoPin", { type });
    },
    [node, onChange, reportEvent]
  );

  return (
    <Menu>
      <MenuItem
        text={`New main input ${maybeDisabledLabel}`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={preventDefaultAnd(() => onAddMainPin("input"))}
        disabled={!nodeIoEditable}
      />
      <MenuItem
        onMouseDown={(e) => e.stopPropagation()}
        text={`New main output ${maybeDisabledLabel}`}
        onClick={preventDefaultAnd(() => onAddMainPin("output"))}
        disabled={!nodeIoEditable}
      />
      <MenuItem
        onMouseDown={(e) => e.stopPropagation()}
        text={`Integrate with existing code (docs link)`}
        href="https://www.flyde.dev/docs/integrate-flows/"
        target="_blank"
        disabled={!nodeIoEditable}
      />
      <MenuItem
        onMouseDown={(e) => e.stopPropagation()}
        text={"Copy node to clipboard"}
        onClick={preventDefaultAnd(copyNodeToClipboard)}
      />
      <MenuItem
        onMouseDown={(e) => e.stopPropagation()}
        text={`Edit Completion Outputs (${
          node.completionOutputs?.join(",") || "n/a"
        })`}
        onClick={preventDefaultAnd(() => editCompletionOutputs())}
      />

      <MenuItem
        onMouseDown={(e) => e.stopPropagation()}
        text={`Edit Reactive inputs (${
          node.reactiveInputs?.join(",") || "n/a"
        })`}
        onClick={preventDefaultAnd(() => editReactiveInputs())}
      />
      <MenuItem
        onMouseDown={(e) => e.stopPropagation()}
        text={`Edit description`}
        onClick={preventDefaultAnd(() => editNodeDescription())}
      />
      <MenuDivider />
      <MenuItem text="Default Style">
        <NodeStyleMenu
          style={node.defaultStyle}
          onChange={onChangeDefaultStyle}
          promptFn={_prompt}
        />
      </MenuItem>
    </Menu>
  );
}
