"use client";

import "@flyde/flow-editor/src/index.scss";
import { useCallback, useEffect, useState } from "react";
import React from "react";
import { FlydeFlow, ResolvedDependencies } from "@flyde/core";
import { safeParse } from "@/lib/safeParse";
import { HistoryPlayer } from "@/lib/executeApp/createHistoryPlayer";
import { FullPageLoader } from "../FullPageLoader";
import { EmbeddedFlyde } from "./EmbeddedFlyde";

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

  const textMode = (
    typeof window !== "undefined" ? (window as any) : ({} as any)
  ).__textMode;

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

  if (flow) {
    if (textMode) {
      return (
        <textarea
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
}
