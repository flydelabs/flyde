import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "../../components/ui/context-menu";
import { isDefined } from "../../utils";
import { NodeStyle, PinType, nodeInput, nodeOutput } from "@flyde/core";
import produce from "immer";
import React from "react";
import { usePrompt, usePorts } from "../..";
import { functionalChange } from "../../flow-editor/flyde-flow-change-type";
import { NodeStyleMenu } from "../instance-view/NodeStyleMenu";
import { useVisualNodeEditorContext } from "../VisualNodeEditorContext";
import { useToast } from "@/hooks/use-toast";

export interface EditorContextMenuProps {
  nodeIoEditable: boolean;
  lastMousePos: React.RefObject<{ x: number; y: number }>;
  onOpenNodesLibrary: () => void;
}

export function EditorContextMenu(props: EditorContextMenuProps) {
  const { nodeIoEditable, lastMousePos, onOpenNodesLibrary } = props;
  const maybeDisabledLabel = nodeIoEditable
    ? ""
    : " (cannot edit main node, only visual)";

  const _prompt = usePrompt();

  const { node, onChangeNode: onChange } = useVisualNodeEditorContext();
  const { reportEvent } = usePorts();

  const { toast } = useToast();

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
    toast({
      description: "Copied!",
    });
  }, [node, toast]);

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
            toast({
              description:
                "Note that this node has explicit completion outputs set. You may need to update them.",
            });
          }
        }
      });

      onChange(newValue, functionalChange("add new io pin"));
      reportEvent("addIoPin", { type });
    },
    [_prompt, lastMousePos, node, onChange, reportEvent, toast]
  );

  return (
    <ContextMenuContent className="w-64">
      <ContextMenuItem onSelect={onOpenNodesLibrary}>Add Node</ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem
        disabled={!nodeIoEditable}
        onSelect={() => onAddMainPin("input")}
      >
        New main input {maybeDisabledLabel}
      </ContextMenuItem>

      <ContextMenuItem
        disabled={!nodeIoEditable}
        onSelect={() => onAddMainPin("output")}
      >
        New main output {maybeDisabledLabel}
      </ContextMenuItem>

      <ContextMenuItem
        disabled={!nodeIoEditable}
        onClick={() =>
          window.open("https://www.flyde.dev/docs/integrate-flows/", "_blank")
        }
      >
        Integrate with existing code (docs link)
      </ContextMenuItem>

      <ContextMenuItem onSelect={copyNodeToClipboard}>
        Copy node to clipboard
      </ContextMenuItem>

      <ContextMenuItem onSelect={editCompletionOutputs}>
        Edit Completion Outputs ({node.completionOutputs?.join(",") || "n/a"})
      </ContextMenuItem>

      <ContextMenuItem onSelect={editReactiveInputs}>
        Edit Reactive inputs ({node.reactiveInputs?.join(",") || "n/a"})
      </ContextMenuItem>

      <ContextMenuItem onSelect={editNodeDescription}>
        Edit description
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuSub>
        <ContextMenuSubTrigger>Default Style</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <NodeStyleMenu
            style={node.defaultStyle}
            onChange={onChangeDefaultStyle}
            promptFn={_prompt}
          />
        </ContextMenuSubContent>
      </ContextMenuSub>
    </ContextMenuContent>
  );
}
