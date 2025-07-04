import { cn } from "../../lib/utils";
import { useEffect, useState } from "react";

const KEY_SYMBOLS_MAC: Record<string, string> = {
  command: "⌘",
  cmd: "⌘",
  ctrl: "Ctrl",
  shift: "⇧",
  alt: "⌥",
  enter: "↵",
  backspace: "⌫",
  delete: "⌦",
  escape: "Esc",
  tab: "⇥",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

const KEY_SYMBOLS_OTHER = {
  ...KEY_SYMBOLS_MAC,
  command: "Ctrl",
  cmd: "Ctrl",
  alt: "Alt",
};

export interface HotkeyIndicationProps {
  className?: string;
  hotkey: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export const HotkeyIndication = ({
  className,
  hotkey,
  label,
  size = "md",
}: HotkeyIndicationProps) => {
  const [keySymbols, setKeySymbols] = useState(KEY_SYMBOLS_OTHER);

  useEffect(() => {
    if (navigator.platform.toLowerCase().includes("mac")) {
      setKeySymbols(KEY_SYMBOLS_MAC as any);
    }
  }, []);

  const formattedHotkey = hotkey
    .toLowerCase()
    .split("+")
    .map(
      (key) => keySymbols[key as keyof typeof keySymbols] || key.toUpperCase()
    )
    .join(" ");

  const textSize = size === "sm" ? "10px" : size === "md" ? "12px" : "14px";

  return (
    <div
      className={cn(
        "text-neutral-600 dark:text-neutral-600 flex items-center gap-1",
        className
      )}
    >
      <span className={`text-[${textSize}] leading-none`}>
        {formattedHotkey}
      </span>
      {label && (
        <span className={`text-[${textSize}] leading-none`}>- {label}</span>
      )}
    </div>
  );
};
