module.exports = {"id":"MouseEvent","inputs":{},"outputs":{"event":{"type":"any"}},"completionOutputs":["never"],"fn":function (inputs, outputs, adv) { getDocument().body.addEventListener('mousemove', ev => {
  outputs.event.next(ev);
}) }}