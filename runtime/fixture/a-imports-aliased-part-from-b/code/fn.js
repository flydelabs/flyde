module.exports = function (inputs, outputs) {
    outputs.result.next(inputs.n1 ** inputs.n2);
}