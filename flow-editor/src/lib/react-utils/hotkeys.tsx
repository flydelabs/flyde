import * as React from "react";
import { Hotkeys, Hotkey } from "@blueprintjs/core";

export enum AppHotkeyCmd {
  SAVE_PART = "save-part",
  NEW_PROJECT = "new-project",
  SAVE_PROJECT = "save-project",
  TOGGLE_SIDE = "toggle-side",
  RUN = "run",
  UNDO = "undo"
}

export enum EditorHotkeyCmd {
  SHOW_OMNIBAR = "show-omnibar",
  CLEAR_SELECTION = "clear-selection",
  DELETE_COMP = "delete-comp",
  DUPLICATE_COMP = "duplicate-comp",
  GROUP = "group",
  SELECT_ALL = "select-all",
  SELECT_CLOSEST = "select-closest"
}

export type AppHotkeysProps = {
  onCmd: (cmd: AppHotkeyCmd) => void;
};

export const hotkey = <T extends AppHotkeyCmd | EditorHotkeyCmd>(
  combo: string,
  label: string,
  cmd: T,
  global?: boolean,
  preventDefault?: boolean
) => {
  return { combo, label, cmd, global, preventDefault };
};

export const appHotkeysConfig = [
  hotkey("shift+p", "Save part", AppHotkeyCmd.SAVE_PART, true, true),
  hotkey("shift+t", "New project", AppHotkeyCmd.NEW_PROJECT, true, true),
  hotkey("cmd+shift+s", "Toggle side", AppHotkeyCmd.TOGGLE_SIDE, true, true),
  hotkey("cmd+s", "Toggle side", AppHotkeyCmd.SAVE_PROJECT, true, true),
  hotkey("shift+r", "Run", AppHotkeyCmd.RUN, true, true),
  hotkey("cmd+z", "Undo", AppHotkeyCmd.UNDO, true, true)
];
