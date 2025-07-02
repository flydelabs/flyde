import { EditorVisualNode } from "@flyde/core";
import { useState } from "react";
import { useSsr } from "usehooks-ts";

export type BootstrapData = {
  initialNode: EditorVisualNode;
  port: number;
  executionId: string;
  darkMode: boolean;
};

export const useBootstrapData = (): BootstrapData | undefined => {
  const { isBrowser } = useSsr();

  const [cachedData, setCachedData] = useState<BootstrapData>();

  if (cachedData) {
    return cachedData;
  }

  if (isBrowser) {
    try {
      const rawData = (window as any).__bootstrapData;
      const decodedData = decodeURIComponent(escape(atob(rawData)));
      const parsedData = JSON.parse(decodedData);
      setCachedData(parsedData);
      return parsedData;
    } catch {
      return undefined;
    }
  } else {
    return undefined;
  }
};
