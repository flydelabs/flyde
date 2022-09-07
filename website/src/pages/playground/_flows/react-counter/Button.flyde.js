const React = require('React');

module.exports = {
    id: 'Button',
    inputs: {
        children: {type: 'any', mode: 'required'}
    },
    outputs: {
        jsx: {type: 'any'},
        click: {type: 'any'}
    },
    completionOutputs: ['jsx'],
    fn: function (inputs, outputs) {
        const comp = React.createElement('button', {
            onClick: (e) => outputs.click.next(e),
        }, inputs.children);  
        
        outputs.jsx.next(comp);
    }
}
