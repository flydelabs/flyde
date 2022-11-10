const React = require('react'); // hack to workaround esm complexities

const part = {
    id: 'Div',
    inputs: {
        children: {type: 'any', mode: 'required'},
        key: {type: 'any', mode: 'optional'}
    },
    outputs: {
        jsx: {type: 'any'},
    },
    completionOutputs: ['jsx'],
    fn: function (inputs, outputs) {
        const comp = React.createElement('div', {key: inputs.key}, inputs.children);  
        outputs.jsx.next(comp);
    }
}

module.exports = part;