import {
  ConnectionNode,
  getPartDef,
  ImportablePart,
  isVisualPart,
  ResolvedFlydeFlowDefinition,
} from "@flyde/core";
import { noop } from "lodash";
import React, { MouseEvent, useCallback } from "react";
import CustomReactTooltip from "../../lib/tooltip";
import { AddPartMenu } from "./AddPartMenu";
import {
  addPartIcon,
  groupIcon,
  inspectIcon,
  pencilIcon,
  removePartIcon,
  ungroupIcon,
} from "./icons/icons";

export enum ActionType {
  AddPart = "add-part",
  RemovePart = "remove-part",
  Group = "group",
  Ungroup = "ungroup",
  AddInlineValue = "add-inline-value",
  Inspect = "inspect",
}

export type ActionData = {
  [ActionType.AddPart]: { importablePart: ImportablePart };
  [ActionType.RemovePart]: undefined;
  [ActionType.Group]: undefined;
  [ActionType.Ungroup]: undefined;
  [ActionType.Inspect]: undefined;
  [ActionType.AddInlineValue]: undefined;
};

export type BaseAction<T extends ActionType> = {
  type: T;
  data: ActionData[T];
};

export type Action =
  | BaseAction<ActionType.AddInlineValue>
  | BaseAction<ActionType.AddPart>
  | BaseAction<ActionType.Group>
  | BaseAction<ActionType.Inspect>
  | BaseAction<ActionType.RemovePart>
  | BaseAction<ActionType.Ungroup>;

export interface ActionsMenuProps {
  selectedInstances: string[];
  flow: ResolvedFlydeFlowDefinition;
  from?: ConnectionNode;
  to?: ConnectionNode;

  onAction: (action: Action) => void;
  onRequestImportables: () => Promise<ImportablePart[]>;
}

export const ActionsMenu: React.FC<ActionsMenuProps> = (props) => {
  const { onAction, selectedInstances, flow, from, to } = props;

  const [showAddPartMenu, setShowAddPartMenu] = React.useState(true);

  const closeAddPartMenu = useCallback(() => {
    setShowAddPartMenu(false);
  }, []);

  const types: ActionType[] = [];

  types.push(ActionType.AddPart);
  types.push(ActionType.AddInlineValue);

  if (selectedInstances.length === 1) {
    const instance = flow.main.instances.find(
      (ins) => ins.id === selectedInstances[0]
    );
    if (!instance) {
      console.error(`Could not find instance with id ${selectedInstances[0]}`);
    } else {
      try {
        const part = getPartDef(instance, props.flow.dependencies);
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
    (type: ActionType, e: MouseEvent) => {
      switch (type) {
        case ActionType.AddPart:
          setShowAddPartMenu(true);
          break;
        default:
          onAction({ type, data: undefined });
      }
    },
    [onAction]
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
    </div>
  );
};

export interface ActionButtonProps {
  onClick: (type: ActionType, e: MouseEvent) => void;
  type: ActionType;
}

const iconsTextMap: Record<ActionType, { icon: string; text: string }> = {
  [ActionType.AddPart]: {
    icon: addPartIcon,
    text: `Open add part menu`,
  },
  [ActionType.RemovePart]: {
    icon: removePartIcon,
    text: `Remove selected instances`,
  },
  [ActionType.Group]: {
    icon: groupIcon,
    text: "Group selection into a new part",
  },
  [ActionType.Ungroup]: {
    icon: ungroupIcon,
    text: "Ungroup selected visual part",
  },
  [ActionType.Inspect]: {
    icon: inspectIcon,
    text: "Inspect data",
  },
  [ActionType.AddInlineValue]: {
    icon: pencilIcon,
    text: "Add value / inline function",
  },
};

const emptyMeta = { icon: "", text: "N/A" };

export const ActionButton: React.FC<ActionButtonProps> = (props) => {
  const { onClick, type } = props;
  const _onClick = useCallback(
    (e: MouseEvent) => onClick(type, e),
    [onClick, type]
  );
  const metaData = iconsTextMap[type] ?? emptyMeta;
  const id = `action-button-${type}-tip`;
  return (
    <div
      className="action-button"
      onClick={_onClick}
      data-tip={metaData.text}
      data-for={id}
    >
      <CustomReactTooltip id={id} delayShow={150} />
      <span
        className="icon-wrapper"
        dangerouslySetInnerHTML={{ __html: metaData.icon }}
      />
    </div>
  );
};
