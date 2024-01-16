import { Button } from "@blueprintjs/core";
import { Tooltip } from "@blueprintjs/core";
import {
  ConnectionNode,
  ImportableSource,
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
import { addNodeIcon, starIcon, playIcon } from "./icons/icons";
import { PromptAIMenu } from "./PromptAIMenu";
import { RunFlowModal } from "./RunFlowModal";

export enum ActionType {
  AddNode = "add-node",
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
  const { onAction, node, hotkeysEnabled, showRunFlowOptions } = props;

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
    (inputs, delay) => {
      setShowRunFlowModal(false);
      return onRunFlow(inputs, delay);
    },
    [onRunFlow]
  );

  const types: ActionType[] = [];

  types.push(ActionType.AddNode);

  if (showRunFlowOptions) {
    types.push(ActionType.Run);
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
            setShowRunFlowModal(true);
          })();
          break;
        case ActionType.AI:
          setShowAIPromptModal(true);
          break;
        default:
          onAction({ type, data: undefined });
      }
    },
    [hideHotkeyHintMap, onAction, onDismissHotkeyHint]
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
