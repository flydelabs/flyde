import { Button, Label, Tag } from '@blueprintjs/core';
import { BasePart, ImportablePart, ImportedPart } from '@flyde/core';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import { AddPartMenuFilter } from '../AddPartMenu';

export interface AddPartMenuListItemProps { 
	importablePart: ImportablePart;
	selected: boolean;
	onAdd: (part: ImportablePart) => void;
	onSelect: (part: ImportablePart) => void;
	onSetFilter: (fitler: AddPartMenuFilter) => void
}

export const AddPartMenuListItem: React.FC<AddPartMenuListItemProps> = (props) => {
	const {importablePart, onSetFilter, onAdd, onSelect} = props;
	const {part, module} = importablePart;
	const {id, description} = part;

	// auto scroll to element if selected
	const ref = React.useRef<HTMLDivElement>(null);
	React.useEffect(() => {
		if (props.selected && ref.current) {
			ref.current.scrollIntoView({block: 'center'});
		}
	}, [props.selected]);

	const _onAdd = useCallback(() => {
		onAdd(importablePart);
	}, [onAdd, importablePart]);

	const _onSelect = useCallback(() => {
		onSelect(importablePart);
	}, [onSelect, importablePart]);


	return <div className={classNames('add-part-menu-list-item', {selected: props.selected})} ref={ref} onClick={_onSelect}>
		<div className='content'>
			<header>
				<span className='id'>{id}</span>
				{/* {part.namespace ? <Tag className='namespace'>Group: {part.namespace}</Tag> : null} */}
				<Tag interactive onClick={() => onSetFilter({type: 'external', module, namespace: part.namespace})} className='source' minimal={true}>{module}{part.namespace ? ` / ${part.namespace}` : null}</Tag>
				</header>
			<div className='description'>{description ? description : <em>No description</em>}</div>
		</div>
		<aside>
			<Button onClick={_onAdd}>Add</Button>
		</aside>
	</div>
}