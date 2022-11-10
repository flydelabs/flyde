module.exports = {"id":"ReloadPage","inputs":{"reload":{"mode":"required","type":"any"}},"outputs":{},"fn":function (inputs, outputs, adv) { const document = getDocument();
document.location.reload();
 }}