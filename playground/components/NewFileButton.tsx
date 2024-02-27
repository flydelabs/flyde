// import { useClickAway } from "@uidotdev/usehooks";
import { AppFileType } from "./AppView";
import { useState } from "react";
import { Popover } from "react-tiny-popover";

export interface NewFileButtonProps {
  onCreateFile: (type: AppFileType) => void;
}

export default function NewFileButton({ onCreateFile }: NewFileButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // const ref = useClickAway(() => setIsMenuOpen(false));

  const popoverMenu = (
    <div
      // ref={ref as any}
      className="absolute left-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabIndex={-1}
    >
      <div className="py-1" role="none">
        {/* <!-- Active: "bg-gray-100 text-gray-900", Not Active: "text-gray-700" --> */}
        <a
          href="#"
          className="text-gray-700 block px-4 py-2 text-sm"
          role="menuitem"
          tabIndex={-1}
          onClick={() => {
            onCreateFile(AppFileType.VISUAL_FLOW);
            setIsMenuOpen(false);
          }}
        >
          New Visual Flow
        </a>
        <a
          href="#"
          className="text-gray-700 block px-4 py-2 text-sm"
          role="menuitem"
          tabIndex={-1}
          onClick={() => {
            onCreateFile(AppFileType.CODE_FLOW);
            setIsMenuOpen(false);
          }}
        >
          New Code Flow
        </a>
      </div>
    </div>
  );

  return (
    <div className="relative inline-block text-left mx-5">
      <Popover
        isOpen={isMenuOpen}
        positions={["top", "bottom", "left", "right"]} // preferred positions by priority
        content={popoverMenu}
        onClickOutside={() => setIsMenuOpen(false)}
      >
        <button
          type="button"
          className="text-blue-500 hover:text-blue-400 focus:outline-none weight-medium text-lg"
          //   className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          +
        </button>
      </Popover>
    </div>
  );
}
