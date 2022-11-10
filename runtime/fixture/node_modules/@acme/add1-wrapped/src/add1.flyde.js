module.exports = {
  id: 'Add1',
  inputs: {
    n: {mode: 'required', type: 'number'},
  },
  outputs: {
    r: 'number'
  },
  fn: (inputs, outputs) => {
    outputs.r.next(inputs.n + 1)
  }
}
