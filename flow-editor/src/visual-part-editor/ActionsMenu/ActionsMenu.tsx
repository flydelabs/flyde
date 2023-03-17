import { Tooltip2 } from "@blueprintjs/popover2";
import {
  ConnectionNode,
  getPartDef,
  ImportablePart,
  isVisualPart,
  PartDefRepo,
  VisualPart,
} from "@flyde/core";
import React, { MouseEvent, MutableRefObject, useCallback } from "react";
import { usePorts } from "../../flow-editor/ports";
import { useHotkeys } from "../../lib/react-utils/use-hotkeys";

import { toastMsg } from "../../toaster";
import { AddPartMenu } from "./AddPartMenu";
import {
  addPartIcon,
  groupIcon,
  inspectIcon,
  pencilIcon,
  playIcon,
  removePartIcon,
  stopIcon,
  ungroupIcon,
} from "./icons/icons";
import { RunFlowModal } from "./RunFlowModal";

export enum ActionType {
  AddPart = "add-part",
  RemovePart = "remove-part",
  Group = "group",
  Ungroup = "ungroup",
  AddInlineValue = "add-inline-value",
  Inspect = "inspect",
  Run = "run",
  Stop = "stop",
}

export type ActionData = {
  [ActionType.AddPart]: { importablePart: ImportablePart };
};

export type BaseAction<T extends ActionType> = {
  type: T;
} & (T extends keyof ActionData ? { data: ActionData[T] } : {});

export type Action<T extends ActionType = ActionType> = {
  [actionType in ActionType]: BaseAction<actionType>;
}[T];

export interface ActionsMenuProps {
  selectedInstances: string[];
  repo: PartDefRepo;
  part: VisualPart;
  from?: ConnectionNode;
  to?: ConnectionNode;
  hotkeysEnabled: MutableRefObject<boolean>;

  onAction: (action: Action) => void;
  onRequestImportables: () => Promise<ImportablePart[]>;
}

export const ActionsMenu: React.FC<ActionsMenuProps> = (props) => {
  const { onAction, selectedInstances, repo, part, from, to, hotkeysEnabled } =
    props;

  const [showAddPartMenu, setShowAddPartMenu] = React.useState(false);
  const [showRunFlowModal, setShowRunFlowModal] = React.useState(false);

  const closeAddPartMenu = useCallback(() => {
    setShowAddPartMenu(false);
  }, []);

  const {onRunFlow, onStopFlow} = usePorts();

  const _runFlow = useCallback<typeof onRunFlow>((inputs) => {
    setShowRunFlowModal(false);
    return onRunFlow(inputs);
  }, [onRunFlow]);

  const types: ActionType[] = [];

  types.push(ActionType.AddPart);
  types.push(ActionType.AddInlineValue);

  if (selectedInstances.length === 1) {
    const instance = part.instances.find(
      (ins) => ins.id === selectedInstances[0]
    );
    if (!instance) {
      console.error(`Could not find instance with id ${selectedInstances[0]}`);
    } else {
      try {
        const part = getPartDef(instance, repo);
        if (isVisualPart(part)) {
          types.push(ActionType.Ungroup);
        }
      } catch (e) {
        console.error(
          `Could not find part with id ${selectedInstances[0]} - ${e}`
        );
      }
    }
  }

  types.push(ActionType.Run);
  types.push(ActionType.Stop);

  if (selectedInstances.length > 0) {
    types.push(ActionType.Group);
  }

  if (selectedInstances.length === 1 || from || to) {
    types.push(ActionType.Inspect);
  }

  if (selectedInstances.length > 0) {
    types.push(ActionType.RemovePart);
  }

  const internalOnAction = useCallback(
    (type: ActionType, e: MouseEvent | KeyboardEvent) => {
      if (e.type === "click" && actionsMetaData[type].hotkey) {
        toastMsg(
          <>
            Did you know? you can also use the hotkey{" "}
            <kbd className="hotkey">{actionsMetaData[type].hotkey}</kbd> to{" "}
            {actionsMetaData[type].text.replace(/^[A-Z]/, (c) =>
              c.toLowerCase()
            )}
          </>,
          "info",
          4000
        );
      }

      switch (type) {
        case ActionType.AddPart:
          setShowAddPartMenu(true);
          break;
        case ActionType.Run:
          void (async function () {
            setShowRunFlowModal(true);
          })()
          break;
        case ActionType.Stop:
          void (async function () {
            onStopFlow();
          })()
          break;
        default:
          onAction({ type, data: undefined });
      }
    },
    [onAction, onStopFlow]
  );

  Object.entries(actionsMetaData).forEach(
    ([action, data]: [ActionType, typeof actionsMetaData[ActionType]]) => {
      if (data.hotkey) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useHotkeys(
          data.hotkey,
          (e) => {
            e.preventDefault();
            if (types.includes(action)) {
              internalOnAction(action, e as any);
            }
          },
          hotkeysEnabled,
          [types]
        );
      }
    }
  );

  const onAddPart = useCallback(
    (importablePart: ImportablePart) => {
      onAction({ type: ActionType.AddPart, data: { importablePart } });
    },
    [onAction]
  );

  return (
    <div className="actions-menu">
      {types.map((type) => (
        <ActionButton key={type} type={type} onClick={internalOnAction} />
      ))}
      {showAddPartMenu ? (
        <AddPartMenu
          onRequestImportables={props.onRequestImportables}
          onAddPart={onAddPart}
          onClose={closeAddPartMenu}
        />
      ) : null}
      {showRunFlowModal ?  (<RunFlowModal onClose={() => setShowRunFlowModal(false)} onRun={_runFlow} part={part}/> ) : null } 
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
  [ActionType.AddPart]: {
    icon: addPartIcon,
    text: 'Open the "add part" menu',
    hotkey: "a",
  },
  [ActionType.RemovePart]: {
    icon: removePartIcon,
    text: `Remove selected instances`,
    hotkey: "backspace",
  },
  [ActionType.Group]: {
    icon: groupIcon,
    text: "Group selection into a new part",
    hotkey: "g",
  },
  [ActionType.Ungroup]: {
    icon: ungroupIcon,
    text: "Ungroup selected visual part",
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
    text: "Run",
    hotkey: "r",
  },
  [ActionType.Stop]: {
    icon: stopIcon,
    text: "Stop",
    hotkey: "s",
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
    <div className="action-button" onClick={_onClick}>
      <Tooltip2
        hoverOpenDelay={100}
        content={text}
        className="icon-wrapper"
        popoverClassName="action-button-tooltip"
      >
        <span dangerouslySetInnerHTML={{ __html: metaData.icon }} />
      </Tooltip2>
    </div>
  );
};
