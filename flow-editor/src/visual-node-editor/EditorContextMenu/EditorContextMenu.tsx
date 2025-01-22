import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Pos } from "@flyde/core";
import { Menu, MenuDivider, MenuItem } from "@blueprintjs/core";
import { isDefined, preventDefaultAnd } from "../../utils";
import { NodeStyle, PinType, nodeInput, nodeOutput } from "@flyde/core";
import produce from "immer";
import React from "react";
import { usePrompt, AppToaster, usePorts, toastMsg } from "../..";
import { functionalChange } from "../../flow-editor/flyde-flow-change-type";
import { NodeStyleMenu } from "../instance-view/NodeStyleMenu";
import { useVisualNodeEditorContext } from "../VisualNodeEditorContext";

interface EditorContextMenuProps {
  nodeIoEditable: boolean;
  lastMousePos: { current: Pos };
  onOpenNodesLibrary: () => void;
}

export function EditorContextMenu({
  nodeIoEditable,
  lastMousePos,
  onOpenNodesLibrary,
}: EditorContextMenuProps) {
  const _prompt = usePrompt();

  const { reportEvent } = usePorts();

  const { node, onChangeNode: onChange } = useVisualNodeEditorContext();

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
    [_prompt, lastMousePos, node, onChange, reportEvent]
  );

  return (
    <ContextMenuContent className="w-64">
      <ContextMenuItem onClick={onOpenNodesLibrary}>Add Node</ContextMenuItem>

      {nodeIoEditable && (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem>Add Input Pin</ContextMenuItem>
          <ContextMenuItem>Add Output Pin</ContextMenuItem>
        </>
      )}
    </ContextMenuContent>
  );
}
