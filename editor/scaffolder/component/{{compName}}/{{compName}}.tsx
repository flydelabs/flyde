import React from 'react';

import './styles.scss';

export interface {{compName}}Props { 

}

export const {{compName}}: React.FC<{{compName}}Props> = (props) => {
	return <div className='{{compName | camelCaseToKebabCase}}'>Bob</div>
}