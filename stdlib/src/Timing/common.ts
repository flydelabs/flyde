export const TIMING_NAMESPACE = "Timing";

export function timeToString(timeMs: number): string {
  if (timeMs < 1000) {
    return `${timeMs}ms`;
  } else {
    return `${timeMs / 1000}s`;
  }
}
