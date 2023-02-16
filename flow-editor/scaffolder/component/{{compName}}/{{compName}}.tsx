import React from 'react';

export interface {{compName}}Props { 

}

export const {{compName}}: React.FC<{{compName}}Props> = (props) => {
	return <div className='{{compName | camelCaseToKebabCase}}'>Bob</div>
}