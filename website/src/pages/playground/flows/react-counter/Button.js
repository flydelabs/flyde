const React = require('React');

module.exports  = function (inputs, outputs) {
    const comp = React.createElement('button', {
        onClick: (e) => outputs.click.next(e),
    }, inputs.children);  
    
    outputs.jsx.next(comp);
}