import { ReactNode } from "react";

export interface SidePaneProps {
  header: JSX.Element | string;
  children?: ReactNode;
  grow?: boolean;
}

export function SidePane(props: SidePaneProps) {
  const { header } = props;
  return (
    <div
      className={`side-pane flex flex-col ${
        props.grow ? "flex-1" : ""
      } border-b border-b-foreground/10 max-h-full`}
    >
      <header className="w-full border-b-foreground/10 flex gap-3 flex-row items-center py-2 px-4 border-b">
        {header}
      </header>
      <div className="overflow-y-auto h-full flex flex-col flex-1">
        {props.children}
      </div>
    </div>
  );
}
