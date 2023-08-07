import { BaseNode, VisualNode } from "@flyde/core";
import { Button, Classes, Dialog, Intent, MenuItem } from "@blueprintjs/core";
import classNames from "classnames";
import React from "react";

// ;

import { BasePartEditor } from "../base-part-editor";

export interface ManageVisualPartViewProps {
  title: string;
  initialPart?: VisualNode;
  externalModule?: boolean;
  onSave: (part: VisualNode) => Promise<void> | void;
  onCancel: () => void;
}

export const renderCreateIOOption = (
  query: string,
  active: boolean,
  handleClick: React.MouseEventHandler<HTMLElement>
) => (
  <MenuItem
    icon="add"
    text={`Create "${query}"`}
    active={active}
    onClick={handleClick}
    shouldDismissPopover={false}
  />
);

const defaultPart: VisualNode = {
  id: "NewPart",
  inputs: {},
  outputs: {},
  instances: [],
  connections: [],
  inputsPosition: {},
  outputsPosition: {},
};

export const ManageVisualPartView: React.FC<ManageVisualPartViewProps> = (
  props
) => {
  const { title } = props;

  const [draftPart, setDraftPart] = React.useState(
    props.initialPart || defaultPart
  );

  const onChangeBasePart = React.useCallback(
    (base: BaseNode) => {
      setDraftPart({ ...draftPart, ...base });
    },
    [draftPart]
  );

  return (
    <div className="manage-visual-part-view">
      <Dialog
        isOpen={true}
        title={title}
        onClose={props.onCancel}
        canEscapeKeyClose={false}
      >
        <main className={classNames(Classes.DIALOG_BODY)}>
          <BasePartEditor
            part={draftPart}
            onChange={onChangeBasePart}
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
              onClick={() => props.onSave(draftPart)}
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
