import { DynamicOutput } from "@site/../core/dist";
import * as React from "react";

import "./OutputLogs.scss";

export interface OutputLogsProps {
  element: JSX.Element;
}

export const OutputJsx: React.FC<OutputLogsProps> = (props) => {
  return (
    <div className="output-jsx">
      <header>
        Output JSX{" "}
      </header>
      <main>
        {props.element}
      </main>
    </div>
  );
};
