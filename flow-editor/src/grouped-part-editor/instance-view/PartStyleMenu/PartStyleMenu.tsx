import { MenuDivider, MenuItem } from '@blueprintjs/core';
import { Part, PartStyle } from '@flyde/core';
import React from 'react';
import { PromptFn, usePrompt } from '../../../flow-editor/ports';

export interface PartStyleMenuProps {
	style: PartStyle | undefined;
	onChange: (style: PartStyle) => void;
	promptFn: PromptFn;
}

const defaultStyle: PartStyle = {size: 'regular'};
export const PartStyleMenu: React.FC<PartStyleMenuProps> = (props) => {
	const {onChange, style: _style} = props;

	const style = _style || defaultStyle;

	const _prompt = props.promptFn;
	const _onChangeStyleProp = <T extends keyof PartStyle>(prop: T, val: PartStyle[T]) => {
		onChange({...style, [prop]: val});
	}
	const onChangeStyleProp = React.useCallback(_onChangeStyleProp, [style, onChange]);

	const onChooseIcon = React.useCallback(async () => {
		const _icon = await _prompt('Icon name? (Font Awesome conventions)', 'rocket');
		const icon = _icon.includes(',') ? _icon.split(',') as [string, string]: _icon;
		
		onChangeStyleProp('icon', icon);
	  }, [_prompt, onChangeStyleProp]);

	return (<React.Fragment>
	<MenuItem text='Color'>
	  <MenuItem text='Amethyst' onClick={() => onChangeStyleProp('color', '#9b5de5')}/>
	  <MenuItem text='Magenta' onClick={() => onChangeStyleProp('color', '#f15bb5')}/>
	  <MenuItem text='Yellow' onClick={() => onChangeStyleProp('color', '#fee440')}/>
	  <MenuItem text='Capri' onClick={() => onChangeStyleProp('color', '#00bbf9')}/>
	  <MenuItem text='Sea Green' onClick={() => onChangeStyleProp('color', '#00f5d4')}/>
	  <MenuDivider/>
	  <MenuItem text='Remove Color' onClick={() => onChangeStyleProp('color', undefined)}/>
	</MenuItem>
	<MenuItem text={`Size (${style.size})`}>
	  <MenuItem text='Small' onClick={() => onChangeStyleProp('size', 'small')}/>
	  <MenuItem text='Regular' onClick={() => onChangeStyleProp('size', 'regular')}/>
	  <MenuItem text='Large' onClick={() => onChangeStyleProp('size', 'large')}/>
	</MenuItem>

	<MenuItem text='Icon'>
	  <MenuItem text='Choose Icon' onClick={onChooseIcon}/>
	  <MenuItem text='Remove Icon' onClick={() => onChangeStyleProp('icon', undefined)}/>
	</MenuItem>
  </React.Fragment>);
}