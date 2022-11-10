import { FlydeFlow, ResolvedFlydeFlowDefinition } from "@flyde/core"
import { useSsr } from "usehooks-ts"

export type BootstrapData = {
    initialFlow: FlydeFlow;
    dependencies: ResolvedFlydeFlowDefinition;
    port: number;
}

export const useBootstrapData = (): BootstrapData | undefined => {
    const {isBrowser } = useSsr();

    
    if (isBrowser) {
        try {
            const data = (window as any).__bootstrapData;
            return JSON.parse(atob(data));
        } catch {
            return undefined;
        }
    } else {
        return undefined;
    }
};
