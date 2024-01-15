import { OMap } from "..";

export const INPUT_MODES: InputPinMode[] = ["queue", "sticky", "static"];

export type InputPinMode = "queue" | "sticky" | "static";

export type QueueInputPinConfig = {
  mode: "queue";
};

export type StickyInputPinConfig = {
  mode: "sticky";
};

export type InputPinConfig = QueueInputPinConfig | StickyInputPinConfig;

export type InputPinsConfig = OMap<InputPinConfig>;

export const queueInputPinConfig = (): QueueInputPinConfig => ({
  mode: "queue",
});

export const stickyInputPinConfig = (): StickyInputPinConfig => ({
  mode: "sticky",
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
