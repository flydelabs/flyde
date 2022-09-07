module.exports = {"id":"concat","inputs":{"a":{"mode":"required","type":"any"},"b":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"object"}},"completionOutputs":["r"],"fn":function (inputs, outputs, adv) { 
          let val = '"${a}${b}"';

          Object.keys(inputs).forEach((key) => {

            const _inpVal = inputs[key]; 
            const inpVal = typeof _inpVal === 'object' ? JSON.stringify(_inpVal) : _inpVal;

            val = val
              .replace('${' + key + '}', inpVal)
              .replace('${' + key + '}', inpVal)
              .replace('${' + key + '}', inpVal) // todo - support more than 3 instances in a nicer way
          })
          outputs.r.next(JSON.parse(val)); }}