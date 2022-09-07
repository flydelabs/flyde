const React = require('React');

module.exports = {
    id: 'Span',
    inputs: {
        children: 'any'
    },
    outputs: {
        jsx: 'any',
    },
    completionOutputs: ['jsx'],
    fn: function (inputs, outputs) {
        const comp = React.createElement('span', {
        }, inputs.children);  
        
        outputs.jsx.next(comp);
    }
}