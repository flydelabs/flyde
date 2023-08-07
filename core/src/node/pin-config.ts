import { OMap } from "..";

export const INPUT_MODES: InputPinMode[] = ["queue", "sticky", "static"];

export type InputPinMode = "queue" | "sticky" | "static";

export type QueueInputPinConfig = {
  mode: "queue";
};

export type StickyInputPinConfig = {
  mode: "sticky";
};

export type StaticInputPinConfig = {
  mode: "static";
  value: any;
};

export type InputPinConfig =
  | QueueInputPinConfig
  | StickyInputPinConfig
  | StaticInputPinConfig;

export type InputPinsConfig = OMap<InputPinConfig>;

export const queueInputPinConfig = (): QueueInputPinConfig => ({
  mode: "queue",
});

export const stickyInputPinConfig = (): StickyInputPinConfig => ({
  mode: "sticky",
});

export const staticInputPinConfig = (value: any): StaticInputPinConfig => ({
  mode: "static",
  value,
});

export const isQueueInputPinConfig = (
  config: InputPinConfig | undefined
): config is QueueInputPinConfig => {
  return (config as QueueInputPinConfig).mode === "queue";
};

export const isStickyInputPinConfig = (
  config: InputPinConfig | undefined
): config is StickyInputPinConfig => {
  return config ? (config as StickyInputPinConfig).mode === "sticky" : false;
};

export function isStaticInputPinConfig (
  config: InputPinConfig | undefined
): config is StaticInputPinConfig {
  return config ? (config as StaticInputPinConfig).mode === "static" : false;
};
