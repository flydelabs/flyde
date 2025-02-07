import { cn } from "@/lib/utils";

export interface HotkeyIndicationProps {
  className?: string;
  hotkey: string;
}

export const HotkeyIndication = ({
  className,
  hotkey,
}: HotkeyIndicationProps) => {
  return (
    <div
      className={cn(
        "text-neutral-500  dark:text-neutral-300 flex items-center gap-1",
        className
      )}
    >
      <span className="text-[10px] leading-none">{hotkey}</span>
    </div>
  );
};
