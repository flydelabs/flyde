module.exports = {"id":"Divide","inputs":{"n1":{"mode":"required","type":"any"},"n2":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"},"divByZero":{"type":"any"}},"fn":function (inputs, outputs, adv) { const { n1, n2 } = inputs;
const { r, divByZero } = outputs;
      
if (n2 === 0) {
      divByZero.next(n1);
} else {
      r.next(n1 / n2);
}
       }}