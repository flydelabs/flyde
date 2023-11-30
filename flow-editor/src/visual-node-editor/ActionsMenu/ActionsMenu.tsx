import { Button } from "@blueprintjs/core";
import { Tooltip } from "@blueprintjs/core";
import {
  ConnectionNode,
  getNodeDef,
  ImportableSource,
  isVisualNode,
  NodesDefCollection,
  VisualNode,
} from "@flyde/core";
import React, { MouseEvent, MutableRefObject, useCallback } from "react";
import { useDependenciesContext } from "../../flow-editor/DependenciesContext";
import { usePorts } from "../../flow-editor/ports";
import { useHotkeys } from "../../lib/react-utils/use-hotkeys";
import { useLocalStorage } from "../../lib/user-preferences";

import { AppToaster, toastMsg } from "../../toaster";
import { AddNodeMenu } from "./AddNodeMenu";
import {
  addNodeIcon,
  starIcon,
  groupIcon,
  inspectIcon,
  pencilIcon,
  playIcon,
  removeNodeIcon,
  ungroupIcon,
} from "./icons/icons";
import { PromptAIMenu } from "./PromptAIMenu";
import { RunFlowModal } from "./RunFlowModal";
import { safelyGetNodeDef } from "../../flow-editor/getNodeDef";

export enum ActionType {
  AddNode = "add-node",
  RemoveNode = "remove-node",
  Group = "group",
  UnGroup = "un-group",
  AddInlineValue = "add-inline-value",
  Inspect = "inspect",
  Run = "run",
  AI = "ai",
}

export type ActionData = {
  [ActionType.AddNode]: { importableNode: ImportableSource };
  [ActionType.AI]: { importableNode: ImportableSource };
};

export type BaseAction<T extends ActionType> = {
  type: T;
} & (T extends keyof ActionData ? { data: ActionData[T] } : {});

export type Action<T extends ActionType = ActionType> = {
  [actionType in ActionType]: BaseAction<actionType>;
}[T];

export interface ActionsMenuProps {
  selectedInstances: string[];
  resolvedNodes: NodesDefCollection;
  node: VisualNode;
  from?: ConnectionNode;
  to?: ConnectionNode;
  hotkeysEnabled: MutableRefObject<boolean>;

  showRunFlowOptions: boolean;

  onAction: (action: Action) => void;
}

export const ActionsMenu: React.FC<ActionsMenuProps> = (props) => {
  const {
    onAction,
    selectedInstances,
    resolvedNodes,
    node,
    from,
    to,
    hotkeysEnabled,
    showRunFlowOptions,
  } = props;

  const { onRequestImportables } = useDependenciesContext();

  const [showAddNodeMenu, setShowAddNodeMenu] = React.useState(false);
  const [showRunFlowModal, setShowRunFlowModal] = React.useState(false);

  const [showAIPromptModal, setShowAIPromptModal] = React.useState(false);
  const [generatingNodeTime, setGeneratingNodeTime] = React.useState<
    number | null
  >(null);

  const [hideHotkeyHintMap, setHideHotkeyHintMap] = useLocalStorage(
    "hideHotkeyHintMap",
    {}
  );

  const closeAddNodeMenu = useCallback(() => {
    setShowAddNodeMenu(false);
  }, []);

  const { onRunFlow, generateNodeFromPrompt, reportEvent } = usePorts();

  const _runFlow = useCallback<typeof onRunFlow>(
    (inputs) => {
      setShowRunFlowModal(false);
      return onRunFlow(inputs);
    },
    [onRunFlow]
  );

  const types: ActionType[] = [];

  types.push(ActionType.AddNode);
  types.push(ActionType.AddInlineValue);

  if (selectedInstances.length === 1) {
    const instance = node.instances.find(
      (ins) => ins.id === selectedInstances[0]
    );
    if (!instance) {
      console.error(`Could not find instance with id ${selectedInstances[0]}`);
    } else {
      try {
        const node = safelyGetNodeDef(instance, resolvedNodes);
        if (isVisualNode(node)) {
          types.push(ActionType.UnGroup);
        }
      } catch (e) {
        console.error(
          `Could not find node with id ${selectedInstances[0]} - ${e}`
        );
      }
    }
  }

  if (showRunFlowOptions) {
    types.push(ActionType.Run);
  }

  if (selectedInstances.length > 0) {
    types.push(ActionType.Group);
  }

  if (selectedInstances.length === 1 || from || to) {
    types.push(ActionType.Inspect);
  }

  if (selectedInstances.length > 0) {
    types.push(ActionType.RemoveNode);
  }

  types.push(ActionType.AI);

  const onDismissHotkeyHint = useCallback(
    (hotkey: string, toastId: string) => {
      setHideHotkeyHintMap({ ...hideHotkeyHintMap, [hotkey]: true });
      AppToaster.dismiss(toastId);
    },
    [hideHotkeyHintMap, setHideHotkeyHintMap]
  );

  const internalOnAction = useCallback(
    (type: ActionType, e: MouseEvent | KeyboardEvent) => {
      const { hotkey } = actionsMetaData[type];
      if (e.type === "click" && hotkey && !hideHotkeyHintMap[hotkey]) {
        const toastId = toastMsg(
          <>
            Did you know? you can also use the hotkey{" "}
            <kbd className="hotkey">{hotkey}</kbd> to{" "}
            {actionsMetaData[type].text.replace(/^[A-Z]/, (c) =>
              c.toLowerCase()
            )}
            <Button
              minimal
              small
              onClick={() => onDismissHotkeyHint(hotkey, toastId)}
            >
              {" "}
              Don't show again{" "}
            </Button>
          </>,
          "none",
          3000
        );
      }

      switch (type) {
        case ActionType.AddNode:
          setShowAddNodeMenu(true);
          break;
        case ActionType.Run:
          void (async function () {
            if (Object.keys(node.inputs).length > 0) {
              setShowRunFlowModal(true);
            } else {
              onRunFlow({});
            }
          })();
          break;
        case ActionType.AI:
          setShowAIPromptModal(true);
          break;
        default:
          onAction({ type, data: undefined });
      }
    },
    [hideHotkeyHintMap, onAction, onDismissHotkeyHint, onRunFlow, node.inputs]
  );

  Object.entries(actionsMetaData).forEach(
    ([action, data]: [ActionType, (typeof actionsMetaData)[ActionType]]) => {
      if (data.hotkey) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useHotkeys(
          data.hotkey,
          (e) => {
            e.preventDefault();
            if (types.includes(action)) {
              internalOnAction(action, e as any);
              setHideHotkeyHintMap({
                ...hideHotkeyHintMap,
                [data.hotkey]: true,
              });
            }
          },
          { text: data.text, group: "Action menu hotkeys" },
          [types],
          hotkeysEnabled
        );
      }
    }
  );

  const onAddNode = useCallback(
    (importableNode: ImportableSource) => {
      onAction({ type: ActionType.AddNode, data: { importableNode } });
    },
    [onAction]
  );

  const onAddAINode = useCallback(
    async (prompt: string) => {
      const startTime = Date.now();
      setGeneratingNodeTime(startTime);
      try {
        reportEvent("generateNodeFromPrompt:start", {
          promptLength: prompt.length,
        });
        const response = await generateNodeFromPrompt({ prompt });
        const { inputs, outputs } = response.importableNode.node;
        const totalTime = Date.now() - startTime;
        reportEvent("generateNodeFromPrompt:success", {
          totalTime,
          inputs: Object.keys(inputs),
          outputs: Object.keys(outputs),
        });
        setGeneratingNodeTime(null);
        onAction({ type: ActionType.AI, data: response });
        setShowAIPromptModal(false);
      } catch (e) {
        setGeneratingNodeTime(null);
        AppToaster.show({
          message: "Failed to generate node",
          intent: "danger",
        });
        reportEvent("generateNodeFromPrompt:failure", {
          error: e.message,
        });
      }
    },
    [generateNodeFromPrompt, onAction, reportEvent]
  );

  return (
    <div className="actions-menu">
      {types.map((type) => (
        <ActionButton key={type} type={type} onClick={internalOnAction} />
      ))}
      {showAddNodeMenu ? (
        <AddNodeMenu
          onRequestImportables={onRequestImportables}
          onAddNode={onAddNode}
          onClose={closeAddNodeMenu}
        />
      ) : null}
      {showRunFlowModal ? (
        <RunFlowModal
          onClose={() => setShowRunFlowModal(false)}
          onRun={_runFlow}
          node={node}
        />
      ) : null}
      {showAIPromptModal ? (
        <PromptAIMenu
          onClose={() => {
            setShowAIPromptModal(false);
            setGeneratingNodeTime(null);
          }}
          onSubmit={onAddAINode}
          submitting={generatingNodeTime !== null}
          submitTime={generatingNodeTime}
        />
      ) : null}
    </div>
  );
};

export interface ActionButtonProps {
  onClick: (type: ActionType, e: MouseEvent) => void;
  type: ActionType;
}

const actionsMetaData: Record<
  ActionType,
  { icon: string; text: string; hotkey?: string }
> = {
  [ActionType.AddNode]: {
    icon: addNodeIcon,
    text: 'Open the "add node" menu',
    hotkey: "a",
  },
  [ActionType.RemoveNode]: {
    icon: removeNodeIcon,
    text: `Remove selected instances`,
    hotkey: "backspace",
  },
  [ActionType.Group]: {
    icon: groupIcon,
    text: "Group selection into a new node",
    hotkey: "g",
  },
  [ActionType.UnGroup]: {
    icon: ungroupIcon,
    text: "Ungroup selected visual node",
  },
  [ActionType.Inspect]: {
    icon: inspectIcon,
    text: "Inspect data",
    hotkey: "i",
  },
  [ActionType.AddInlineValue]: {
    icon: pencilIcon,
    text: "Add value / inline function",
    hotkey: "v",
  },
  [ActionType.Run]: {
    icon: playIcon,
    text: "Run flow",
    hotkey: "r",
  },
  [ActionType.AI]: {
    icon: starIcon,
    text: "Generate new code node using AI ✨",
  },
};

const emptyMeta = { icon: "", text: "N/A", hotkey: undefined };

export const ActionButton: React.FC<ActionButtonProps> = (props) => {
  const { onClick, type } = props;
  const _onClick = useCallback(
    (e: MouseEvent) => onClick(type, e),
    [onClick, type]
  );
  const metaData = actionsMetaData[type] ?? emptyMeta;

  const text = metaData.hotkey ? (
    <span>
      {metaData.text} <kbd className="hotkey">{metaData.hotkey}</kbd>
    </span>
  ) : (
    metaData.text
  );
  return (
    <div className="action-button" onClick={_onClick} data-type={type}>
      <Tooltip
        hoverOpenDelay={100}
        content={text}
        className="icon-wrapper"
        popoverClassName="action-button-tooltip"
      >
        <span dangerouslySetInnerHTML={{ __html: metaData.icon }} />
      </Tooltip>
    </div>
  );
};
