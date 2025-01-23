import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImportableSource } from "@flyde/core";
import classNames from "classnames";
import React, { useCallback } from "react";
import { AddNodeMenuFilter } from "../AddNodeMenu";

export interface AddNodeMenuListItemProps {
  importableNode: ImportableSource;
  selected: boolean;
  onAdd: (node: ImportableSource) => void;
  onSelect: (node: ImportableSource) => void;
  onSetFilter: (fitler: AddNodeMenuFilter) => void;
}

export const AddNodeMenuListItem: React.FC<AddNodeMenuListItemProps> = (
  props
) => {
  const { importableNode, onSetFilter, onAdd, onSelect } = props;
  const { node, module } = importableNode;
  const { id, description, displayName } = node;

  // auto scroll to element if selected
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (props.selected && ref.current) {
      ref.current.scrollIntoView({ block: "center" });
    }
  }, [props.selected]);

  const _onAdd = useCallback(() => {
    onAdd(importableNode);
  }, [onAdd, importableNode]);

  const _onSelect = useCallback(() => {
    onSelect(importableNode);
  }, [onSelect, importableNode]);

  return (
    <div
      className={classNames(
        "flex items-center justify-between p-3 hover:bg-accent/50 cursor-pointer rounded-md",
        {
          "bg-accent": props.selected,
        }
      )}
      ref={ref}
      onClick={_onSelect}
    >
      <div className="flex-1">
        <header className="flex items-center gap-2">
          <span className="font-medium">{displayName ?? id}</span>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-accent"
            onClick={() =>
              onSetFilter({
                type: "external",
                module,
                namespace: node.namespace,
              })
            }
          >
            {module}
            {node.namespace ? ` / ${node.namespace}` : null}
          </Badge>
        </header>
        <div className="text-sm text-muted-foreground mt-1">
          {description ? description : <em>No description</em>}
        </div>
      </div>
      <div>
        <Button variant="secondary" size="sm" onClick={_onAdd}>
          Add
        </Button>
      </div>
    </div>
  );
};
