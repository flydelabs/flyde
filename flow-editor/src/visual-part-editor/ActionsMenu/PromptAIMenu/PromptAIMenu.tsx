import { Dialog, Classes, Intent, Button } from "@blueprintjs/core";
import classNames from "classnames";
import React from "react";

export interface PromptAIMenuProps {
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  submitting?: boolean;
}

export const PromptAIMenu: React.FC<PromptAIMenuProps> = (props) => {
  const { onClose } = props;

  const [prompt, setPrompt] = React.useState("");

  const onSubmit = () => {
    props.onSubmit(prompt);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} className="prompt-ai-menu">
      <main
        className={classNames(Classes.DIALOG_BODY)}
        // onKeyDown={onKeyDown}
        tabIndex={0}
      >
        <strong>
          This part receives external inputs. Enter values for each input below:
        </strong>

        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      </main>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={onClose}>Close</Button>
          <Button
            intent={Intent.PRIMARY}
            className="run-btn"
            disabled={props.submitting}
            loading={props.submitting}
            onClick={onSubmit}
          >
            Create ✨
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
