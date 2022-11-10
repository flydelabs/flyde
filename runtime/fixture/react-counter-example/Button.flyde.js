const React = require('React');

module.exports = {
    id: 'Button',
    inputs: {
        children: 'any'
    },
    outputs: {
        jsx: 'any',
        click: 'any'
    },
    completionOutputs: ['jsx'],
    fn: function (inputs, outputs) {
        const comp = React.createElement('button', {
            onClick: (e) => outputs.click.next(e),
        }, inputs.children);  
        
        outputs.jsx.next(comp);
    }
}
