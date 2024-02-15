import {
  Button,
  Classes,
  Dialog,
  H4,
  Menu,
  MenuDivider,
  MenuItem,
} from "@blueprintjs/core";
import { HotkeysDialogProps } from "@blueprintjs/core/lib/cjs/components/hotkeys/hotkeysDialog2";
import { Hotkey } from "@blueprintjs/core/lib/cjs/components/hotkeys/hotkey";

import { PopoverProps, Popover } from "@blueprintjs/core";

import React from "react";
import {
  currentHotkeys,
  HotkeysMenuData,
} from "../../lib/react-utils/use-hotkeys";

import { usePorts } from "../../flow-editor/ports";

export interface HelpBubbleProps {}

const popperModifiers: PopoverProps["modifiers"] = {
  offset: { enabled: true, options: { offset: [0, 20] } },
  preventOverflow: { enabled: true, options: { padding: 10 } },
};

function hotkeyToBpHotkey(hotkey: {
  key: string;
  menuData: HotkeysMenuData;
}): HotkeysDialogProps["hotkeys"][0] {
  return {
    combo: hotkey.key,
    label: hotkey.menuData.text,
    group: hotkey.menuData.group,
  };
}

const groupsOrder = ["Viewport Controls", "Editing", "Selection"];

type Mutable<Type> = {
  -readonly [Key in keyof Type]: Type[Key];
};

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
    title: "Trigg - Cloud Managed Flyde",
    link: "https://www.trigg.dev/?ref=help-menu",
  },
];

export const HelpBubble: React.FC<HelpBubbleProps> = () => {
  const [hotkeysModalOpen, setHotkeysModalOpen] = React.useState(false);

  const bpHotkeys = Array.from(currentHotkeys.entries()).map(
    ([keys, menuData]) => hotkeyToBpHotkey({ key: keys, menuData })
  );

  const groupedHotkeys = bpHotkeys.reduce((acc, hotkey) => {
    if (!acc[hotkey.group]) {
      acc[hotkey.group] = [];
    }
    acc[hotkey.group].push(hotkey);
    return acc;
  }, {} as { [key: string]: Mutable<HotkeysDialogProps["hotkeys"]> });

  const groupsArray = Object.entries(groupedHotkeys).sort((a, b) => {
    return groupsOrder.indexOf(b[0]) - groupsOrder.indexOf(a[0]);
  });

  const { reportEvent } = usePorts();

  const hotkeysModal = (
    <Dialog
      isOpen={hotkeysModalOpen}
      onClose={() => setHotkeysModalOpen(false)}
    >
      <div className={Classes.DIALOG_BODY}>
        {groupsArray.map(([group, hotkeys]) => (
          <React.Fragment key={group}>
            <H4>{group}</H4>
            {hotkeys.map((hotkey) => {
              return <Hotkey {...hotkey} key={hotkey.combo} />;
            })}
          </React.Fragment>
        ))}
      </div>
    </Dialog>
  );

  const menu = (
    <Menu>
      {mainDocItems.map((item) => (
        <MenuItem
          key={item.title}
          text={item.title}
          onClick={() => {
            reportEvent("helpMenuItem", { item: item.title });
          }}
          href={item.link}
          target="_blank"
        />
      ))}
      <MenuDivider />
      <MenuItem
        text="Discord"
        onClick={() => reportEvent("helpMenuItem", { item: "discord" })}
        href="https://discord.gg/x7t4tjZQP8"
        target="_blank"
      />
      <MenuItem
        text="Hotkeys"
        onClick={() => {
          setHotkeysModalOpen(true);
          reportEvent("helpMenuItem", { item: "hotkeys" });
        }}
      />
      <MenuItem
        text="Full Documentation"
        onClick={() => reportEvent("helpMenuItem", { item: "documentation" })}
        href="https://www.flyde.dev/docs"
        target="_blank"
      />
    </Menu>
  );
  return (
    <div className="help-bubble" data-tip="Help">
      <Popover
        content={menu}
        modifiers={popperModifiers}
        onOpened={() => reportEvent("helpMenuOpen", {})}
      >
        <Button>Help</Button>
      </Popover>
      {hotkeysModal}
    </div>
  );
};
