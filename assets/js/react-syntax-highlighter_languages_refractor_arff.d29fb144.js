"use strict";
exports.id = 1438;
exports.ids = [1438];
exports.modules = {

/***/ 21253:
/***/ ((module) => {



module.exports = arff
arff.displayName = 'arff'
arff.aliases = []
function arff(Prism) {
  Prism.languages.arff = {
    comment: /%.*/,
    string: {
      pattern: /(["'])(?:\\.|(?!\1)[^\\\r\n])*\1/,
      greedy: true
    },
    keyword: /@(?:attribute|data|end|relation)\b/i,
    number: /\b\d+(?:\.\d+)?\b/,
    punctuation: /[{},]/
  }
}


/***/ })

};
;