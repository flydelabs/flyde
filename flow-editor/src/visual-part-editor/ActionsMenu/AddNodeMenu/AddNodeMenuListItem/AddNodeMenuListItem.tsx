import { Button, Label, Tag } from "@blueprintjs/core";
import { BaseNode, ImportableSource, ImportedNode } from "@flyde/core";
import classNames from "classnames";
import React, { useCallback } from "react";
import { AddNodeMenuFilter } from "../AddNodeMenu";

export interface AddNodeMenuListItemProps {
  importableNode: ImportableSource;
  selected: boolean;
  onAdd: (part: ImportableSource) => void;
  onSelect: (part: ImportableSource) => void;
  onSetFilter: (fitler: AddNodeMenuFilter) => void;
}

export const AddNodeMenuListItem: React.FC<AddNodeMenuListItemProps> = (
  props
) => {
  const { importableNode, onSetFilter, onAdd, onSelect } = props;
  const { part, module } = importableNode;
  const { id, description } = part;

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
      className={classNames("add-part-menu-list-item", {
        selected: props.selected,
      })}
      ref={ref}
      onClick={_onSelect}
    >
      <div className="content">
        <header>
          <span className="id">{id}</span>
          {/* {part.namespace ? <Tag className='namespace'>Group: {part.namespace}</Tag> : null} */}
          <Tag
            interactive
            onClick={() =>
              onSetFilter({
                type: "external",
                module,
                namespace: part.namespace,
              })
            }
            className="source"
            minimal={true}
          >
            {module}
            {part.namespace ? ` / ${part.namespace}` : null}
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
