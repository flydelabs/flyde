import { CodePart, CustomPart } from "@flyde/core";
import { Button, Classes, Dialog, Intent, MenuItem } from "@blueprintjs/core";
import classNames from "classnames";
import React from "react";

// ;

import { CodePartEditor } from "../code-part-editor";

export interface ManageCodePartViewProps {
  title: string;
  initialPart?: CodePart;
  externalModule?: boolean;
  onSave: (part: CustomPart) => Promise<void> | void;
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

const defaultPart: CodePart = {
  id: "NewPart",
  inputs: {},
  outputs: {},
  fnCode: `// magic here`,
};

export const ManageCodePartView: React.FC<ManageCodePartViewProps> = (
  props
) => {
  const { title } = props;

  const [draftPart, setDraftPart] = React.useState(defaultPart);

  return (
    <div className="manage-code-part-view">
      <Dialog
        isOpen={true}
        title={title}
        onClose={props.onCancel}
        canEscapeKeyClose={false}
      >
        <main className={classNames(Classes.DIALOG_BODY)}>
          <CodePartEditor
            part={draftPart}
            onChange={setDraftPart}
            editMode={false}
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
