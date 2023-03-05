"use strict";
exports.id = 3818;
exports.ids = [3818,3980];
exports.modules = {

/***/ 30607:
/***/ ((module) => {



module.exports = java
java.displayName = 'java'
java.aliases = []
function java(Prism) {
  ;(function(Prism) {
    var keywords = /\b(?:abstract|continue|for|new|switch|assert|default|goto|package|synchronized|boolean|do|if|private|this|break|double|implements|protected|throw|byte|else|import|public|throws|case|enum|instanceof|return|transient|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|strictfp|volatile|const|float|native|super|while|var|null|exports|module|open|opens|provides|requires|to|transitive|uses|with)\b/ // based on the java naming conventions
    var className = /\b[A-Z](?:\w*[a-z]\w*)?\b/
    Prism.languages.java = Prism.languages.extend('clike', {
      'class-name': [
        className, // variables and parameters
        // this to support class names (or generic parameters) which do not contain a lower case letter (also works for methods)
        /\b[A-Z]\w*(?=\s+\w+\s*[;,=())])/
      ],
      keyword: keywords,
      function: [
        Prism.languages.clike.function,
        {
          pattern: /(\:\:)[a-z_]\w*/,
          lookbehind: true
        }
      ],
      number: /\b0b[01][01_]*L?\b|\b0x[\da-f_]*\.?[\da-f_p+-]+\b|(?:\b\d[\d_]*\.?[\d_]*|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i,
      operator: {
        pattern: /(^|[^.])(?:<<=?|>>>?=?|->|([-+&|])\2|[?:~]|[-+*/%&|^!=<>]=?)/m,
        lookbehind: true
      }
    })
    Prism.languages.insertBefore('java', 'class-name', {
      annotation: {
        alias: 'punctuation',
        pattern: /(^|[^.])@\w+/,
        lookbehind: true
      },
      namespace: {
        pattern: /(\b(?:exports|import(?:\s+static)?|module|open|opens|package|provides|requires|to|transitive|uses|with)\s+)[a-z]\w*(\.[a-z]\w*)+/,
        lookbehind: true,
        inside: {
          punctuation: /\./
        }
      },
      generics: {
        pattern: /<(?:[\w\s,.&?]|<(?:[\w\s,.&?]|<(?:[\w\s,.&?]|<[\w\s,.&?]*>)*>)*>)*>/,
        inside: {
          'class-name': className,
          keyword: keywords,
          punctuation: /[<>(),.:]/,
          operator: /[?&|]/
        }
      }
    })
  })(Prism)
}


/***/ }),

/***/ 38188:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var refractorJava = __webpack_require__(30607)
module.exports = scala
scala.displayName = 'scala'
scala.aliases = []
function scala(Prism) {
  Prism.register(refractorJava)
  Prism.languages.scala = Prism.languages.extend('java', {
    keyword: /<-|=>|\b(?:abstract|case|catch|class|def|do|else|extends|final|finally|for|forSome|if|implicit|import|lazy|match|new|null|object|override|package|private|protected|return|sealed|self|super|this|throw|trait|try|type|val|var|while|with|yield)\b/,
    string: [
      {
        pattern: /"""[\s\S]*?"""/,
        greedy: true
      },
      {
        pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
        greedy: true
      }
    ],
    builtin: /\b(?:String|Int|Long|Short|Byte|Boolean|Double|Float|Char|Any|AnyRef|AnyVal|Unit|Nothing)\b/,
    number: /\b0x[\da-f]*\.?[\da-f]+|(?:\b\d+\.?\d*|\B\.\d+)(?:e\d+)?[dfl]?/i,
    symbol: /'[^\d\s\\]\w*/
  })
  delete Prism.languages.scala['class-name']
  delete Prism.languages.scala['function']
}


/***/ })

};
;