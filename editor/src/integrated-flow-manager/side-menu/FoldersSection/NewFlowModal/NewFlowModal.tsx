import {
  Dialog,
  Classes,
  Button,
  Intent,
  Callout,
  Code,
} from "@blueprintjs/core";
import { BaseNode, visualNode } from "@flyde/core";
import classNames from "classnames";
import React from "react";
import { BaseNodeEditor } from "@flyde/flow-editor"; // ../../../../../common/flow-editor/base-node-editor

import "./NewFlowModal.scss";

export interface NewFlowModalProps {
  onCancel: () => void;
  onCreate: (node: BaseNode) => void;
  folder: string;
}

export const NewFlowModal: React.FC<NewFlowModalProps> = (props) => {
  const [baseNode, setBaseNode] = React.useState<BaseNode>(
    visualNode({ id: "new-flow.flyde" })
  );

  return (
    <div className="new-flow-modal">
      <Dialog
        isOpen={true}
        title="Create New Flow"
        onClose={props.onCancel}
        canEscapeKeyClose={false}
      >
        <main className={classNames(Classes.DIALOG_BODY)}>
          <Callout>
            Will create new flow inside <Code>{props.folder}</Code>
          </Callout>
          <BaseNodeEditor
            node={baseNode}
            onChange={setBaseNode}
            idDisabled={false}
            hiddenOutputs
          />
        </main>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={props.onCancel}>Cancel</Button>
            <Button
              onClick={() => props.onCreate(baseNode)}
              intent={Intent.PRIMARY}
            >
              Save
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
