"use client";

import "@flyde/flow-editor/src/index.scss";
import { useCallback, useEffect, useMemo, useState } from "react";
import React from "react";
import { FlydeFlow, ResolvedDependencies } from "@flyde/core";
import { safeParse } from "@/lib/safeParse";
import { HistoryPlayer } from "@/lib/executeApp/createHistoryPlayer";
import { FullPageLoader } from "../FullPageLoader";
import { EmbeddedFlyde } from "./EmbeddedFlyde";
import { InfoTooltip } from "../InfoToolip";

export interface EmbeddedFlydeFileWrapperProps {
  content: string;
  onFileChange: (content: string) => void;
  fileName: string;
  localNodes: ResolvedDependencies;
  historyPlayer: HistoryPlayer;
}

export function EmbeddedFlydeFileWrapper(props: EmbeddedFlydeFileWrapperProps) {
  const { content, onFileChange, localNodes, historyPlayer } = props;
  const [flow, setFlow] = useState<FlydeFlow>();

  const [error, setError] = useState<Error>();

  const [textMode, setTextMode] = useState(false);

  useEffect(() => {
    const parsed = safeParse<FlydeFlow>(content);
    if (parsed.type === "ok") {
      const isChanged = JSON.stringify(parsed.data) !== JSON.stringify(flow);
      if (!flow || isChanged) {
        console.log("isChanged", isChanged);
        setFlow(parsed.data);
      }
    } else {
      setError(parsed.error as any);
    }
  }, [content, flow]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onChange = useCallback(
    (flow: FlydeFlow) => {
      onFileChange(JSON.stringify(flow, null, 2));
    },
    [onFileChange]
  );

  const inner = useMemo(() => {
    if (flow) {
      if (textMode) {
        return (
          <textarea
            className="w-full h-full flex-grow p-4 font-mono"
            value={content}
            onChange={(e) => onFileChange(e.target.value)}
          />
        );
      } else {
        return (
          <EmbeddedFlyde
            key={props.fileName}
            flow={flow}
            onChange={onChange}
            localNodes={localNodes}
            historyPlayer={historyPlayer}
          />
        );
      }
    } else if (error) {
      return <p>Error parsing Flyde: {error?.message}</p>;
    } else {
      return <FullPageLoader />;
    }
  }, [flow, textMode]);

  return (
    <div className="embedded-wrapper flex-grow overflow-y-auto h-full relative">
      {inner}

      <div className="absolute right-4 top-4">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={textMode}
            onChange={(e) => setTextMode(e.target.checked)}
          />
          <div className="relative w-8 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
            Raw Data{" "}
            <InfoTooltip content="View the flow's raw data. Note: playground uses JSON to reduce dependencies, but .flyde files use a yaml format, with the same underlying data" />
          </span>
        </label>
      </div>
    </div>
  );
}
