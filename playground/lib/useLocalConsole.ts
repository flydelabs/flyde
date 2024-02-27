import { useMemo, useState } from "react";

export interface ConsoleItem {
  type: "log" | "error" | "warn" | "info";
  content: string;
  timestamp: number;
}

export type CustomConsole = Pick<
  typeof console,
  "log" | "error" | "warn" | "info"
>;

export function useCustomConsole() {
  const [items, setItems] = useState<ConsoleItem[]>([]);

  const customConsole = useMemo<CustomConsole>(() => {
    return (["log", "error", "warn", "info"] as const).reduce((acc, type) => {
      acc[type] = (...args: any[]) => {
        const content = args.map((arg) => JSON.stringify(arg)).join(" ");
        setItems((items) => [
          ...items,
          { type, content, timestamp: Date.now() },
        ]);
      };
      return acc;
    }, {} as CustomConsole);
  }, []);

  return {
    items,
    customConsole,
    clearConsole: () => setItems([]),
  };
}
