import { FlydeFlow, ResolvedFlydeFlowDefinition } from "@flyde/core";
import { useState } from "react";
import { useSsr } from "usehooks-ts";

export type BootstrapData = {
  initialFlow: FlydeFlow;
  dependencies: ResolvedFlydeFlowDefinition['dependencies'];
  port: number;
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
      const parsedData = JSON.parse(atob(rawData));
      setCachedData(parsedData);
      return parsedData;
    } catch {
      return undefined;
    }
  } else {
    return undefined;
  }
};
