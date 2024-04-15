import { Button } from "@blueprintjs/core";
import React, { useMemo } from "react";
import { useDarkMode } from "../../flow-editor/DarkModeContext";
import classNames from "classnames";

export type SelectionTypeInput = {
  type: "input";
  pinId: string;
};

export type SelectionTypeOutput = {
  type: "output";
  pinId: string;
};

export type SelectionTypeInstances = {
  type: "instances";
  ids: string[];
};

export type SelectionTypeConnections = {
  type: "connections";
  ids: string[];
};

export type SelectionType = SelectionTypeInput | SelectionTypeOutput | SelectionTypeInstances | SelectionTypeConnections;

export interface SelectionIndicatorProps {
  selection: SelectionType;
  onCenter: () => void;
  onGroup: () => void;
  onDelete: (ids: string[]) => void;
}

export const SelectionIndicator: React.FC<SelectionIndicatorProps> = (
  props
) => {
  const { selection, onCenter, onGroup, onDelete } = props;

  const dark = useDarkMode();

  const inner = useMemo(() => {
    switch (selection.type) {
      case "input":
        return (
          <span>
            <strong>"{selection.pinId}"</strong> input selected
          </span>
        );
      case "output":
        return (
          <span>
            <strong>"{selection.pinId}"</strong> output selected
          </span>
        );
      case "instances":
        return (
          <span>
            {selection.ids.length} instance
            {selection.ids.length > 1 ? "s" : ""} selected
          </span>
        );
      case "connections":
        return (
          <span>
            {selection.ids.length} connection
            {selection.ids.length > 1 ? "s" : ""} selected
          </span>
        );
    }
  }, [selection]);

  const onDeleteClick = () => {
    switch (selection.type) {
      case "instances":
        onDelete(selection.ids);
        break;
      case "connections":
        onDelete(selection.ids);
        break;
    }
  }

  const actions = {
    center: (<Button onClick={onCenter} small minimal outlined>Center</Button>),
    group: (<Button onClick={onGroup} small minimal outlined>Group</Button>),
    delete: (<Button onClick={onDeleteClick} small minimal outlined intent="danger">Delete</Button>),
  }

  const actionsMap = {
    instances: [actions.center, actions.group, actions.delete],
    connections: [actions.delete],
    input: [actions.center],
    output: [actions.center],
  }

  return (
    <div className={classNames("selection-indicator", { dark })}>
      {inner}{" "}
      {actionsMap[selection.type]}
    </div>
  );
};
