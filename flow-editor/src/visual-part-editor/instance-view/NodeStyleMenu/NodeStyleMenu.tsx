import { MenuDivider, MenuItem } from "@blueprintjs/core";
import { NodeStyle } from "@flyde/core";
import React, { useCallback } from "react";
import { PromptFn } from "../../../flow-editor/ports";
import { toastMsg } from "../../../toaster";

export interface NodeStyleMenuProps {
  style: NodeStyle | undefined;
  onChange: (style: NodeStyle) => void;
  promptFn: PromptFn;
}

export const partStylePresetColors: { name: string; color: string }[] = [
  { name: "Amethyst", color: "#9b5de5" },
  { name: "Magenta", color: "#f15bb5" },
  { name: "Yellow", color: "#fee440" },
  { name: "Capri", color: "#00bbf9" },
  { name: "Sea Green", color: "#00f5d4" },
  { name: "Orange", color: "#ff7f00" },
];

const defaultStyle: NodeStyle = { size: "regular" };
export const NodeStyleMenu: React.FC<NodeStyleMenuProps> = (props) => {
  const { onChange, style: _style } = props;

  const style = _style || defaultStyle;

  const _prompt = props.promptFn;
  const _onChangeStyleProp = <T extends keyof NodeStyle>(
    prop: T,
    val: NodeStyle[T]
  ) => {
    onChange({ ...style, [prop]: val });
  };
  const onChangeStyleProp = React.useCallback(_onChangeStyleProp, [
    style,
    onChange,
  ]);

  const onChooseIcon = React.useCallback(async () => {
    const _icon = await _prompt(
      "Icon name? (Font Awesome conventions)",
      "rocket"
    );
    const icon = _icon.includes(",")
      ? (_icon.split(",") as [string, string])
      : _icon;

    onChangeStyleProp("icon", icon);
  }, [_prompt, onChangeStyleProp]);

  const onChooseCustomStyling = useCallback(async () => {
    const custom = await _prompt(
      "Enter a custom style (valid JSON representing a React CSS object)",
      style.cssOverride ? JSON.stringify(style.cssOverride) : ""
    );
    try {
      const obj = JSON.parse(custom);
      onChangeStyleProp("cssOverride", obj);
    } catch (e) {
      console.error(e);
      toastMsg("Invalid object", "danger");
    }
  }, [_prompt, onChangeStyleProp, style.cssOverride]);

  return (
    <React.Fragment>
      <MenuItem text="Color">
        {partStylePresetColors.map((c) => (
          <MenuItem
            key={c.name}
            text={c.name}
            onClick={() => onChangeStyleProp("color", c.color)}
          />
        ))}
        <MenuDivider />
        <MenuItem
          text="Remove Color"
          onClick={() => onChangeStyleProp("color", undefined)}
        />
      </MenuItem>
      <MenuItem text={`Size (${style.size ?? "regular"})`}>
        <MenuItem
          text="Small"
          onClick={() => onChangeStyleProp("size", "small")}
        />
        <MenuItem
          text="Regular"
          onClick={() => onChangeStyleProp("size", "regular")}
        />
        <MenuItem
          text="Large"
          onClick={() => onChangeStyleProp("size", "large")}
        />
      </MenuItem>

      <MenuItem text="Icon">
        <MenuItem text="Choose Icon" onClick={onChooseIcon} />
        <MenuItem
          text="Remove Icon"
          onClick={() => onChangeStyleProp("icon", undefined)}
        />
      </MenuItem>
      <MenuItem
        text="Custom Styling"
        onClick={onChooseCustomStyling}
      ></MenuItem>
    </React.Fragment>
  );
};
