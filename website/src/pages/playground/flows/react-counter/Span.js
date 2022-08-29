const React = require('React');

module.exports  = function (inputs, outputs) {
    const comp = React.createElement('span', {
    }, inputs.children);  
    
    outputs.jsx.next(comp);
}