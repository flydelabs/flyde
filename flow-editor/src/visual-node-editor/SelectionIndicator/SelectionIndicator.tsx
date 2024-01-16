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

export interface SelectionIndicatorProps {
  selection: SelectionTypeInput | SelectionTypeOutput | SelectionTypeInstances;
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
    }
  }, [selection]);

  return (
    <div className={classNames("selection-indicator", { dark })}>
      {inner}{" "}
      <Button onClick={onCenter} small minimal outlined>
        Center
      </Button>
      {selection.type === "instances" ? (
        <>
          <Button onClick={onGroup} small minimal outlined>
            Group
          </Button>
          <Button
            onClick={() => onDelete(selection.ids)}
            small
            minimal
            outlined
            intent="danger"
          >
            Delete
          </Button>
        </>
      ) : null}
    </div>
  );
};
