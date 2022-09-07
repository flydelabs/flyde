module.exports = {"id":"IndexOf","inputs":{"str":{"mode":"required","type":"any"},"char":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"},"notFound":{"type":"any"}},"fn":function (inputs, outputs, adv) { const { str, char } = inputs;
const { r, notFound } = outputs;
        
// magic here
const i = str.indexOf(char);
if (i !== -1) {
    r.next(str.indexOf(char));
} else {
    notFound.next(str);
}   }}