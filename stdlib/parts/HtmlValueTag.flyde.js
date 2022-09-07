module.exports = {"id":"HtmlValueTag","inputs":{"id":{"mode":"required-if-connected","type":"any"},"style":{"mode":"required-if-connected","type":"any"},"className":{"mode":"required-if-connected","type":"any"},"tagName":{"mode":"required","type":"any"},"extra":{"mode":"required-if-connected","type":"any"},"children":{"mode":"required-if-connected","type":"any"},"value":{"mode":"required-if-connected","type":"any"},"placeholder":{"mode":"required-if-connected","type":"any"}},"outputs":{"jsx":{"type":"any"},"click":{"type":"any"},"change":{"type":"any"}},"fn":function (inputs, outputs, adv) { // magic here
const props = {
    className: inputs.className,
    id: inputs.id,
    style: inputs.style
}

const onClick = outputs.click ? (e) => outputs.click.next(e) : undefined;
const onChange = outputs.change ? (e) => outputs.change.next(e.target.value) : undefined;
const comp = React.createElement(inputs.tagName, {
    ...props,
    ...(inputs.extra || {}),
    onClick,
    onChange
}, inputs.children);

outputs.jsx.next(comp); }}