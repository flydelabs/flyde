import { BaseNode, VisualNode } from "@flyde/core";
import { Button, Classes, Dialog, Intent, MenuItem } from "@blueprintjs/core";
import classNames from "classnames";
import React from "react";

// ;

import { BaseNodeEditor } from "../base-node-editor";
import { Add } from "@blueprintjs/icons";

export interface ManageVisualNodeViewProps {
  title: string;
  initialNode?: VisualNode;
  externalModule?: boolean;
  onSave: (node: VisualNode) => Promise<void> | void;
  onCancel: () => void;
}

export const renderCreateIOOption = (
  query: string,
  active: boolean,
  handleClick: React.MouseEventHandler<HTMLElement>
) => (
  <MenuItem
    icon={<Add />}
    text={`Create "${query}"`}
    active={active}
    onClick={handleClick}
    shouldDismissPopover={false}
  />
);

const defaultNode: VisualNode = {
  id: "NewNode",
  inputs: {},
  outputs: {},
  instances: [],
  connections: [],
  inputsPosition: {},
  outputsPosition: {},
};

export const ManageVisualNodeView: React.FC<ManageVisualNodeViewProps> = (
  props
) => {
  const { title } = props;

  const [draftNode, setDraftNode] = React.useState(
    props.initialNode || defaultNode
  );

  const onChangeBaseNode = React.useCallback(
    (base: BaseNode) => {
      setDraftNode({ ...draftNode, ...base });
    },
    [draftNode]
  );

  return (
    <div className="manage-visual-node-view">
      <Dialog
        isOpen={true}
        title={title}
        onClose={props.onCancel}
        canEscapeKeyClose={false}
      >
        <main className={classNames(Classes.DIALOG_BODY)}>
          <BaseNodeEditor
            node={draftNode}
            onChange={onChangeBaseNode}
            idDisabled={false}
          />
          {props.externalModule ? (
            <strong>External module, saving is disabled</strong>
          ) : null}
        </main>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={props.onCancel}>Cancel</Button>
            <Button
              onClick={() => props.onSave(draftNode)}
              intent={Intent.PRIMARY}
              disabled={props.externalModule}
            >
              Save
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
