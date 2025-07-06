export type FlydeFlowChangeType = {
  type: "functional" | "meta";
  message: string;
};

export const functionalChange = (message: string): FlydeFlowChangeType => ({
  type: "functional",
  message,
});

export const metaChange = (message = "n/a"): FlydeFlowChangeType => ({
  type: "meta",
  message,
});
