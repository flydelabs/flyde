module.exports = {"id":"HeadCSS","inputs":{"css":{"mode":"required","type":"any"},"key":{"mode":"optional","type":"any"}},"outputs":{},"fn":function (inputs, outputs, adv) { try {
    const document = getDocument();
    const normKey = inputs.key || "default-css";
    const tag = document.createElement("style");
    tag.innerHTML = inputs.css;
    tag.id = normKey;
    
    const existing = document.getElementById(normKey);
    if (existing) {
      existing.remove();
    }
    document.head.appendChild(tag);
} catch (e) {
    log(`Unable to run head css part`, e);
} }}