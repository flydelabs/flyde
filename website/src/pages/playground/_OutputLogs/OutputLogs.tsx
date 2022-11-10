import { DynamicOutput } from "@site/../core/dist";
import * as React from "react";

import "./OutputLogs.scss";

export interface OutputLogsProps {
  output: DynamicOutput;
}

export type LogItemProps = {
  value: string | JSX.Element;
  time: number;
};

export const LogItem: React.FC<LogItemProps> = (props) => {
  return (
    <li className="log-item">
      <main className="content">{props.value}</main>
      <aside>{new Date(props.time).toLocaleTimeString()}</aside>
    </li>
  );
};

export const OutputLogs: React.FC<OutputLogsProps> = (props) => {
  const [log, setLog] = React.useState<LogItemProps[]>([]);

  React.useEffect(() => {
    props.output.subscribe((rawValue) => {
      const value = typeof rawValue === 'object' && React.isValidElement(rawValue)  ? rawValue : `${rawValue}`;
      setLog((logs) => [...logs, { value, time: Date.now() }]);
    });
  }, []);

  return (
    <div className="output-log">
      <header>
        Output Log{" "}
        <button
          className="clear-btn button button--outline button--secondary button--sm"
          onClick={() => setLog([])}
        >
          Clear
        </button>
      </header>
      <main>
        <ul>
          {log.map((o, i) => (
            <LogItem {...o} key={i} />
          ))}
        </ul>
        {log.length === 0 ? (
          <div className="empty-state">
            Nothing to show. Interact with the example to emit some outputs!
          </div>
        ) : null}
      </main>
    </div>
  );
};
