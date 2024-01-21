import { ConfigurableInput } from "../lib/ConfigurableInput";

export const TIMING_NAMESPACE = "Timing";

export type TimingNodeConfig = ConfigurableInput<{ timeMs: number }>;

export function timeToString(timeMs: number): string {
  if (timeMs < 1000) {
    return `${timeMs}ms`;
  } else {
    return `${timeMs / 1000}s`;
  }
}
