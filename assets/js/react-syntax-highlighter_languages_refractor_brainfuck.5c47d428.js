"use strict";
exports.id = 5539;
exports.ids = [5539];
exports.modules = {

/***/ 39512:
/***/ ((module) => {



module.exports = brainfuck
brainfuck.displayName = 'brainfuck'
brainfuck.aliases = []
function brainfuck(Prism) {
  Prism.languages.brainfuck = {
    pointer: {
      pattern: /<|>/,
      alias: 'keyword'
    },
    increment: {
      pattern: /\+/,
      alias: 'inserted'
    },
    decrement: {
      pattern: /-/,
      alias: 'deleted'
    },
    branching: {
      pattern: /\[|\]/,
      alias: 'important'
    },
    operator: /[.,]/,
    comment: /\S+/
  }
}


/***/ })

};
;