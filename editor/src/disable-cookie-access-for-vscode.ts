export const disableCookieAccessForVscode = () => {
    const cookieDesc: any =
    Object.getOwnPropertyDescriptor(Document.prototype, "cookie") ||
    Object.getOwnPropertyDescriptor(HTMLDocument.prototype, "cookie");
  if (cookieDesc && cookieDesc.configurable) {
    Object.defineProperty(document, "cookie", {
      get: function () {
        const e = new Error();
        console.log("getting cookie", e.stack);
        return "";
        // return cookieDesc.get.call(document);
      },
      set: function (val) {
        console.log("setting cookie");
        cookieDesc.set.call(document, val);
      },
    });
  }
}

