import { NodeStyle } from "@flyde/core";
import React, { useCallback } from "react";
import { PromptFn } from "../../../flow-editor/ports";

import {
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuSeparator,
} from "@flyde/ui";

import { useToast } from "@flyde/ui";

export interface NodeStyleMenuProps {
  style: NodeStyle | undefined;
  onChange: (style: NodeStyle) => void;
  promptFn: PromptFn;
}

export const nodeStylePresetColors: { name: string; color: string }[] = [
  { name: "Amethyst", color: "#9b5de5" },
  { name: "Magenta", color: "#f15bb5" },
  { name: "Yellow", color: "#fee440" },
  { name: "Capri", color: "#00bbf9" },
  { name: "Sea Green", color: "#00f5d4" },
  { name: "Orange", color: "#ff7f00" },
];

const defaultStyle: NodeStyle = {};

export const NodeStyleMenu: React.FC<NodeStyleMenuProps> = (props) => {
  const { onChange, style: _style } = props;

  const { toast } = useToast();
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
      toast({
        description: "Invalid custom style",
        variant: "destructive",
      });
    }
  }, [_prompt, onChangeStyleProp, style.cssOverride, toast]);

  return (
    <React.Fragment>
      <ContextMenuSub>
        <ContextMenuSubTrigger>Color</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          {nodeStylePresetColors.map((c) => (
            <ContextMenuItem
              key={c.name}
              onClick={() => onChangeStyleProp("color", c.color)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                {c.name}
              </div>
            </ContextMenuItem>
          ))}
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => onChangeStyleProp("color", undefined)}
          >
            Remove Color
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger>Icon</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuItem onClick={onChooseIcon}>Choose Icon</ContextMenuItem>
          <ContextMenuItem onClick={() => onChangeStyleProp("icon", undefined)}>
            Remove Icon
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuItem onClick={onChooseCustomStyling}>
        Custom Styling
      </ContextMenuItem>
    </React.Fragment>
  );
};
