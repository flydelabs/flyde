
module.exports = function localCodeRefFnExecuteNativeFn (inputs, outputs) {
    outputs.result.next(inputs.n1 + inputs.n2);
}
