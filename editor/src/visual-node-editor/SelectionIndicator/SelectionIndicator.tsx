import { Button } from "../../ui";
import React, { useMemo } from "react";
import { useDarkMode } from "../../flow-editor/DarkModeContext";
import { cn } from "../../lib/utils";

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

export type SelectionType =
  | SelectionTypeInput
  | SelectionTypeOutput
  | SelectionTypeInstances
  | SelectionTypeConnections;

export interface SelectionIndicatorProps {
  selection: SelectionType | undefined;
  onCenter: () => void;
  onGroup: () => void;
  onDelete: (ids: string[]) => void;
}

export const SelectionIndicator: React.FC<SelectionIndicatorProps> = (
  props
) => {
  const { selection, onCenter, onGroup, onDelete } = props;
  const dark = useDarkMode();

  if (!selection) {
    return null;
  }


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
  };

  const actions = {
    center: (
      <Button onClick={onCenter} variant="outline" size="sm">
        Center
      </Button>
    ),
    group: (
      <Button onClick={onGroup} variant="outline" size="sm">
        Group
      </Button>
    ),
    delete: (
      <Button
        onClick={onDeleteClick}
        variant="outline"
        size="sm"
        className="text-destructive hover:bg-destructive/90 hover:text-destructive-foreground"
      >
        Delete
      </Button>
    ),
  };

  const actionsMap = {
    instances: [actions.center, actions.group, actions.delete],
    connections: [actions.delete],
    input: [actions.center],
    output: [actions.center],
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-md border absolute bottom-[10px] left-1/2 -translate-x-1/2 text-xs z-1 select-none",
        dark ? "bg-background border-border" : "bg-white border-input"
      )}
    >
      {inner} <div className="flex gap-2">{actionsMap[selection.type]}</div>
    </div>
  );
};
