import { ConnectionData, ConnectionNode, getPartDef, isVisualPart, ResolvedFlydeFlowDefinition } from '@flyde/core';
import React, { MouseEvent, useCallback } from 'react';
import CustomReactTooltip from '../../lib/tooltip';
import { addPartIcon, groupIcon, inspectIcon, pencilIcon, removePartIcon, ungroupIcon } from './icons/icons';

export enum ActionType {
	AddPart = 'AddPart',
	RemovePart = 'RemovePart',
	Group = 'Group',
	UnGroup = 'UnGroup',
	Value = 'Value',
	Inspect = 'Inspect'
}
export interface ActionsMenuProps { 
	onAction: (action: ActionType, e: MouseEvent) => void;
	selectedInstances: string[];
	flow: ResolvedFlydeFlowDefinition;
	from?: ConnectionNode;
	to?: ConnectionNode;
}

export const ActionsMenu: React.FC<ActionsMenuProps> = (props) => {
	const {onAction, selectedInstances, flow, from, to} = props;

	const types = [];

	types.push(ActionType.AddPart);
	types.push(ActionType.Value);

	if (selectedInstances.length === 1) {
		const instance = flow.main.instances.find(ins => ins.id === selectedInstances[0]);
		if (!instance) {
			console.error(`Could not find instance with id ${selectedInstances[0]}`)
		} else {
			try {
				const part = getPartDef(instance, props.flow.dependencies);
				if (isVisualPart(part)) {
					types.push(ActionType.UnGroup);
				}
			} catch (e) {
				console.error(`Could not find part with id ${selectedInstances[0]} - ${e}`)
			}
		}
	}

	if (selectedInstances.length > 0) {
		types.push(ActionType.Group);
	}

	if (selectedInstances.length === 1 || from || to) {
		types.push(ActionType.Inspect);
	}

	if (selectedInstances.length > 0) {
		types.push(ActionType.RemovePart);
	}

	return <div className='actions-menu'>
		{types.map((type) => <ActionButton key={type} type={type} onClick={onAction} />)}
	</div>
}

export interface ActionButtonProps {
	onClick: (type: ActionType, e: MouseEvent) => void;
	type: ActionType;
}

const iconsTextMap: Record<ActionType, {icon: string, text: string}> = {
	[ActionType.AddPart]: {
		icon: addPartIcon,
		text: `Open add part menu`
	},
	[ActionType.RemovePart]: {
		icon: removePartIcon,
		text: `Remove selected instances`
	},
	[ActionType.Group]: {
		icon: groupIcon,
		text: 'Group selection into a new part'
	},
	[ActionType.UnGroup]: {
		icon: ungroupIcon,
		text: 'Ungroup selected visual part'
	},
	[ActionType.Inspect]: {
		icon: inspectIcon,
		text: 'Inspect data'
	},
	[ActionType.Value]: {
		icon: pencilIcon,
		text: 'Add value / inline function'
	}
}

const emptyMeta =  {icon: '', text: 'N/A'};

export const ActionButton: React.FC<ActionButtonProps> = (props) => {
	const {onClick, type} = props;
	const _onClick = useCallback((e: MouseEvent) => onClick(type, e), [onClick, type]);
	const metaData = iconsTextMap[type] ?? emptyMeta;
	const id = `action-button-${type}-tip`;
	return (<div className='action-button' onClick={_onClick} data-tip={metaData.text} data-for={id}>
		      <CustomReactTooltip  id={id} delayShow={150}/>
    		<span className="icon-wrapper" dangerouslySetInnerHTML={{ __html:  metaData.icon}} />
		</div>);
}
