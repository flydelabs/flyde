import {
  Button,
  Callout,
  Classes,
  Dialog,
  FormGroup,
  Intent,
} from "@blueprintjs/core";
import { InfoSign } from "@blueprintjs/icons";
import { PinType } from "@flyde/core";
import classNames from "classnames";
import React, { useCallback, useMemo } from "react";

export interface AddMainPinModalProps {
  type: PinType;
  onAdd: (type: PinType, name: string) => void;
  onClose: () => void;
}

export const AddMainPinModal: React.FC<AddMainPinModalProps> = ({
  type,
  onAdd,
  onClose,
}) => {
  const [name, setName] = React.useState("");

  const _onAdd = useCallback(() => {
    onAdd(type, name);
  }, [name, onAdd, type]);

  const explanation = useMemo(() => {
    const suffix = (
      <>
        Learn how to connect this flow with your casebase{" "}
        <a href="https://www.flyde.dev/docs/integrate-flows">here</a>
      </>
    );
    switch (type) {
      case "input": {
        return (
          <Callout intent="primary" icon={<InfoSign />}>
            Main inputs are Flyde's way of receiving external data.
            <div>{suffix}</div>
          </Callout>
        );
      }
      case "output": {
        <Callout intent="primary" icon={<InfoSign />}>
          Main outputs are Flyde's way of emitting values externally.
          <div>{suffix}</div>
        </Callout>;
      }
    }
  }, [type]);

  return (
    <Dialog isOpen={true} onClose={onClose} className="add-main-pin-modal">
      <main className={classNames(Classes.DIALOG_BODY)} tabIndex={0}>
        <FormGroup>
          <label className={Classes.LABEL}>New main {type} name:</label>
          <input
            className={Classes.INPUT}
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormGroup>
        {explanation}
      </main>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={onClose}>Close</Button>
          <Button onClick={_onAdd} intent={Intent.PRIMARY}>
            Add
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
