
declare module '*.flyde' {
    type FlydeFlow = import('@flyde/core').FlydeFlow;
    type ResolvedFlydeRuntimeFlow = import('@flyde/core').ResolvedFlydeRuntimeFlow;

    const classes: {resolvedFlow: ResolvedFlydeRuntimeFlow, flow: FlydeFlow};
    export default classes;
  }