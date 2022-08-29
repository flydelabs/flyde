module.exports = function (inputs, outputs) {
    console.log(424242, {inputs});
    outputs.r.next(inputs.n1 + inputs.n2 + inputs.n3);
}
