import { Button } from "../../ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui";
import { useMemo } from "react";
import * as React from "react";
import {
  currentHotkeys,
  HotkeysMenuData,
} from "../../lib/react-utils/use-hotkeys";
import { usePorts } from "../../flow-editor/ports";
import { isMac } from "../..";

export interface HelpBubbleProps {}

function hotkeyToBpHotkey(hotkey: { key: string; menuData: HotkeysMenuData }) {
  return {
    combo: hotkey.key,
    label: hotkey.menuData.text,
    group: hotkey.menuData.group,
  };
}

const groupsOrder = ["Viewport Controls", "Editing", "Selection"];

const mainDocItems = [
  {
    title: "Core Concepts",
    link: "https://www.flyde.dev/docs/core-concepts/",
  },
  {
    title: "Integrate With Existing Code",
    link: "https://www.flyde.dev/docs/integrate-flows/",
  },
  {
    title: "Creating Custom Nodes",
    link: "https://www.flyde.dev/docs/custom-nodes/",
  },
  {
    title: "Trouble-shooting",
    link: "https://www.flyde.dev/docs/troubleshooting/",
  },
  {
    title: "Flowcode - Hosted API Builder",
    link: "https://www.getflowcode.io/?ref=help-menu",
  },
];

export function HelpBubble() {
  const [hotkeysModalOpen, setHotkeysModalOpen] = React.useState(false);
  const _isMac = useMemo(isMac, []);

  const bpHotkeys = Array.from(currentHotkeys.entries()).map(
    ([_keys, menuData]) => {
      const keys = _keys.split(/,\s*/).find((key) => {
        return _isMac && key.includes("cmd") ? true : !key.includes("cmd");
      });
      return hotkeyToBpHotkey({ key: keys!, menuData });
    }
  );

  const groupedHotkeys = bpHotkeys.reduce((acc, hotkey) => {
    if (!acc[hotkey.group]) {
      acc[hotkey.group] = [];
    }
    acc[hotkey.group]!.push(hotkey);
    return acc;
  }, {} as { [key: string]: Array<ReturnType<typeof hotkeyToBpHotkey>> });

  const groupsArray = Object.entries(groupedHotkeys).sort((a, b) => {
    return groupsOrder.indexOf(b[0]) - groupsOrder.indexOf(a[0]);
  });

  const { reportEvent } = usePorts();

  return (
    <div className="help-bubble" data-tip="Help">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            onClick={() => reportEvent("helpMenuOpen", {})}
          >
            Help
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="p-2 min-w-[200px]"
          sideOffset={20}
          align="end"
        >
          {mainDocItems.map((item) => (
            <DropdownMenuItem
              key={item.title}
              onClick={() => {
                reportEvent("helpMenuItem", { item: item.title });
                window.open(item.link, "_blank");
              }}
            >
              {item.title}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              reportEvent("helpMenuItem", { item: "discord" });
              window.open("https://discord.gg/x7t4tjZQP8", "_blank");
            }}
          >
            Discord
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setHotkeysModalOpen(true);
              reportEvent("helpMenuItem", { item: "hotkeys" });
            }}
          >
            Hotkeys
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              reportEvent("helpMenuItem", { item: "documentation" });
              window.open("https://www.flyde.dev/docs", "_blank");
            }}
          >
            Full Documentation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={hotkeysModalOpen} onOpenChange={setHotkeysModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {groupsArray.map(([group, hotkeys]) => (
              <div key={group}>
                <h4 className="text-lg font-semibold mb-2">{group}</h4>
                <div className="space-y-2">
                  {hotkeys.map((hotkey) => (
                    <div key={hotkey.combo} className="flex justify-between">
                      <span>{hotkey.label}</span>
                      <kbd className="px-2 py-1 bg-muted rounded">
                        {hotkey.combo}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
