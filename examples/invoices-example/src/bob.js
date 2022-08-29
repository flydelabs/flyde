const cuid = require('cuid');

module.exports = function (inputs, outputs) {
    outputs.r.next(`Hello ${inputs.a} and ${inputs.b}! and ${cuid()}`);
}