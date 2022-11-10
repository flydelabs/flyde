const React = require('react'); // hack to workaround esm complexities

const part = {
    id: 'Span',
    inputs: {
        children: {type: 'any', mode: 'required'}
    },
    outputs: {
        jsx: {type: 'any'},
    },
    completionOutputs: ['jsx'],
    fn: function (inputs, outputs) {
        const comp = React.createElement('span', {
        }, inputs.children);  
        
        outputs.jsx.next(comp);
    }
}

module.exports = part;