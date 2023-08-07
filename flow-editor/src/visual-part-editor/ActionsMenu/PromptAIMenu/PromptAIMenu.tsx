import {
  Dialog,
  Classes,
  Intent,
  Button,
  ProgressBar,
  TextArea,
  Callout,
} from "@blueprintjs/core";
import classNames from "classnames";
import React, { useEffect } from "react";
import { usePorts } from "../../../flow-editor/ports";

export interface PromptAIMenuProps {
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  submitting?: boolean;
  submitTime?: number;
}

const ETA = 10000;

export const PromptAIMenu: React.FC<PromptAIMenuProps> = (props) => {
  const { onClose } = props;

  const [prompt, setPrompt] = React.useState("");

  const [progress, setProgress] = React.useState(0);

  // const { hasOpenAiToken } = usePorts();

  // const [openAiStatus, setOpenAiStatus] = React.useState<
  //   "loading" | "enabled" | "disabled"
  // >("enabled");

  // useEffect(() => {
  //   hasOpenAiToken().then((val) =>
  //     setOpenAiStatus(val ? "enabled" : "disabled")
  //   );
  // }, [hasOpenAiToken]);

  const onSubmit = () => {
    setProgress(0.0);
    props.onSubmit(prompt);
  };

  useEffect(() => {
    const stepTime = ETA / 20;
    const stepValue = stepTime / ETA;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        const real = (Date.now() - props.submitTime) / ETA;
        return Math.min(real + (stepValue * Math.random()) / 2, 0.95);
      });
    }, stepTime);
    return () => clearInterval(interval);
  }, [props.submitTime]);

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      className="prompt-ai-menu"
      title="✨ Generate Code Node using AI"
    >
      <main
        className={classNames(Classes.DIALOG_BODY)}
        // onKeyDown={onKeyDown}
        tabIndex={0}
      >
        <TextArea
          value={prompt}
          disabled={props.submitting}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your part in details"
          fill
        />
        {/* {openAiStatus === "disabled" ? (
          <Callout intent={Intent.WARNING}>
            You need to set up your OpenAI API key in order to use this feature.
            Open the command palette and search for "Flyde: Set OpenAI API Key"
            to set it
          </Callout>
        ) : null} */}
      </main>
      {props.submitTime ? (
        <div className="progress-bar-container">
          <ProgressBar value={progress} />
        </div>
      ) : null}
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={onClose}>Close</Button>
          <Button
            intent={Intent.PRIMARY}
            className="run-btn"
            disabled={
              props.submitting || !prompt // ||  openAiStatus === "disabled"
            }
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
