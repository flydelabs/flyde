import { Button, Label, Tag } from "@blueprintjs/core";
import { BaseNode, ImportableSource, ImportedNode } from "@flyde/core";
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
      className={classNames("add-node-menu-list-item", {
        selected: props.selected,
      })}
      ref={ref}
      onClick={_onSelect}
    >
      <div className="content">
        <header>
          <span className="name">{displayName ?? id}</span>
          {/* {node.namespace ? <Tag className='namespace'>Group: {node.namespace}</Tag> : null} */}
          <Tag
            interactive
            onClick={() =>
              onSetFilter({
                type: "external",
                module,
                namespace: node.namespace,
              })
            }
            className="source"
            minimal={true}
          >
            {module}
            {node.namespace ? ` / ${node.namespace}` : null}
          </Tag>
        </header>
        <div className="description">
          {description ? description : <em>No description</em>}
        </div>
      </div>
      <aside>
        <Button onClick={_onAdd}>Add</Button>
      </aside>
    </div>
  );
};
