import React from 'react';
import { getMainInstanceIndicatorDomId } from '../dom-ids';

export interface MainInstanceEventsIndicatorProps { 
	  currentInsId: string;
	  ancestorsInsIds?: string;
}

export const MainInstanceEventsIndicator: React.FC<MainInstanceEventsIndicatorProps> = (props) => {
	const { currentInsId, ancestorsInsIds } = props;
	return <div className='main-instance-events-indicator'>
		<span id={getMainInstanceIndicatorDomId(currentInsId, ancestorsInsIds)} className="status-text"></span>
	</div>
}