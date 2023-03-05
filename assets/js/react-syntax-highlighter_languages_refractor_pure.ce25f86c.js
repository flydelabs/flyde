"use strict";
exports.id = 9315;
exports.ids = [9315,8950];
exports.modules = {

/***/ 72849:
/***/ ((module) => {



module.exports = c
c.displayName = 'c'
c.aliases = []
function c(Prism) {
  Prism.languages.c = Prism.languages.extend('clike', {
    'class-name': {
      pattern: /(\b(?:enum|struct)\s+)\w+/,
      lookbehind: true
    },
    keyword: /\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/,
    operator: />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/,
    number: /(?:\b0x(?:[\da-f]+\.?[\da-f]*|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?)[ful]*/i
  })
  Prism.languages.insertBefore('c', 'string', {
    macro: {
      // allow for multiline macro definitions
      // spaces after the # character compile fine with gcc
      pattern: /(^\s*)#\s*[a-z]+(?:[^\r\n\\]|\\(?:\r\n|[\s\S]))*/im,
      lookbehind: true,
      alias: 'property',
      inside: {
        // highlight the path of the include statement as a string
        string: {
          pattern: /(#\s*include\s*)(?:<.+?>|("|')(?:\\?.)+?\2)/,
          lookbehind: true
        },
        // highlight macro directives as keywords
        directive: {
          pattern: /(#\s*)\b(?:define|defined|elif|else|endif|error|ifdef|ifndef|if|import|include|line|pragma|undef|using)\b/,
          lookbehind: true,
          alias: 'keyword'
        }
      }
    },
    // highlight predefined macros as constants
    constant: /\b(?:__FILE__|__LINE__|__DATE__|__TIME__|__TIMESTAMP__|__func__|EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|stdin|stdout|stderr)\b/
  })
  delete Prism.languages.c['boolean']
}


/***/ }),

/***/ 76853:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var refractorC = __webpack_require__(72849)
module.exports = pure
pure.displayName = 'pure'
pure.aliases = []
function pure(Prism) {
  Prism.register(refractorC)
  ;(function(Prism) {
    Prism.languages.pure = {
      comment: [
        {
          pattern: /(^|[^\\])\/\*[\s\S]*?\*\//,
          lookbehind: true
        },
        {
          pattern: /(^|[^\\:])\/\/.*/,
          lookbehind: true
        },
        /#!.+/
      ],
      'inline-lang': {
        pattern: /%<[\s\S]+?%>/,
        greedy: true,
        inside: {
          lang: {
            pattern: /(^%< *)-\*-.+?-\*-/,
            lookbehind: true,
            alias: 'comment'
          },
          delimiter: {
            pattern: /^%<.*|%>$/,
            alias: 'punctuation'
          }
        }
      },
      string: {
        pattern: /"(?:\\.|[^"\\\r\n])*"/,
        greedy: true
      },
      number: {
        // The look-behind prevents wrong highlighting of the .. operator
        pattern: /((?:\.\.)?)(?:\b(?:inf|nan)\b|\b0x[\da-f]+|(?:\b(?:0b)?\d+(?:\.\d)?|\B\.\d)\d*(?:e[+-]?\d+)?L?)/i,
        lookbehind: true
      },
      keyword: /\b(?:ans|break|bt|case|catch|cd|clear|const|def|del|dump|else|end|exit|extern|false|force|help|if|infix[lr]?|interface|let|ls|mem|namespace|nonfix|NULL|of|otherwise|outfix|override|postfix|prefix|private|public|pwd|quit|run|save|show|stats|then|throw|trace|true|type|underride|using|when|with)\b/,
      function: /\b(?:abs|add_(?:(?:fundef|interface|macdef|typedef)(?:_at)?|addr|constdef|vardef)|all|any|applp?|arity|bigintp?|blob(?:_crc|_size|p)?|boolp?|byte_(?:matrix|pointer)|byte_c?string(?:_pointer)?|calloc|cat|catmap|ceil|char[ps]?|check_ptrtag|chr|clear_sentry|clearsym|closurep?|cmatrixp?|cols?|colcat(?:map)?|colmap|colrev|colvector(?:p|seq)?|complex(?:_float_(?:matrix|pointer)|_matrix(?:_view)?|_pointer|p)?|conj|cookedp?|cst|cstring(?:_(?:dup|list|vector))?|curry3?|cyclen?|del_(?:constdef|fundef|interface|macdef|typedef|vardef)|delete|diag(?:mat)?|dim|dmatrixp?|do|double(?:_matrix(?:_view)?|_pointer|p)?|dowith3?|drop|dropwhile|eval(?:cmd)?|exactp|filter|fix|fixity|flip|float(?:_matrix|_pointer)|floor|fold[lr]1?|frac|free|funp?|functionp?|gcd|get(?:_(?:byte|constdef|double|float|fundef|int(?:64)?|interface(?:_typedef)?|long|macdef|pointer|ptrtag|short|sentry|string|typedef|vardef))?|globsym|hash|head|id|im|imatrixp?|index|inexactp|infp|init|insert|int(?:_matrix(?:_view)?|_pointer|p)?|int64_(?:matrix|pointer)|integerp?|iteraten?|iterwhile|join|keys?|lambdap?|last(?:err(?:pos)?)?|lcd|list[2p]?|listmap|make_ptrtag|malloc|map|matcat|matrixp?|max|member|min|nanp|nargs|nmatrixp?|null|numberp?|ord|pack(?:ed)?|pointer(?:_cast|_tag|_type|p)?|pow|pred|ptrtag|put(?:_(?:byte|double|float|int(?:64)?|long|pointer|short|string))?|rationalp?|re|realp?|realloc|recordp?|redim|reduce(?:_with)?|refp?|repeatn?|reverse|rlistp?|round|rows?|rowcat(?:map)?|rowmap|rowrev|rowvector(?:p|seq)?|same|scan[lr]1?|sentry|sgn|short_(?:matrix|pointer)|slice|smatrixp?|sort|split|str|strcat|stream|stride|string(?:_(?:dup|list|vector)|p)?|subdiag(?:mat)?|submat|subseq2?|substr|succ|supdiag(?:mat)?|symbolp?|tail|take|takewhile|thunkp?|transpose|trunc|tuplep?|typep|ubyte|uint(?:64)?|ulong|uncurry3?|unref|unzip3?|update|ushort|vals?|varp?|vector(?:p|seq)?|void|zip3?|zipwith3?)\b/,
      special: {
        pattern: /\b__[a-z]+__\b/i,
        alias: 'builtin'
      },
      // Any combination of operator chars can be an operator
      operator: /(?=\b_|[^_])[!"#$%&'*+,\-.\/:<=>?@\\^_`|~\u00a1-\u00bf\u00d7-\u00f7\u20d0-\u2bff]+|\b(?:and|div|mod|not|or)\b/,
      // FIXME: How can we prevent | and , to be highlighted as operator when they are used alone?
      punctuation: /[(){}\[\];,|]/
    }
    var inlineLanguages = [
      'c',
      {
        lang: 'c++',
        alias: 'cpp'
      },
      'fortran'
    ]
    var inlineLanguageRe = /%< *-\*- *{lang}\d* *-\*-[\s\S]+?%>/.source
    inlineLanguages.forEach(function(lang) {
      var alias = lang
      if (typeof lang !== 'string') {
        alias = lang.alias
        lang = lang.lang
      }
      if (Prism.languages[alias]) {
        var o = {}
        o['inline-lang-' + alias] = {
          pattern: RegExp(
            inlineLanguageRe.replace(
              '{lang}',
              lang.replace(/([.+*?\/\\(){}\[\]])/g, '\\$1')
            ),
            'i'
          ),
          inside: Prism.util.clone(Prism.languages.pure['inline-lang'].inside)
        }
        o['inline-lang-' + alias].inside.rest = Prism.util.clone(
          Prism.languages[alias]
        )
        Prism.languages.insertBefore('pure', 'inline-lang', o)
      }
    }) // C is the default inline language
    if (Prism.languages.c) {
      Prism.languages.pure['inline-lang'].inside.rest = Prism.util.clone(
        Prism.languages.c
      )
    }
  })(Prism)
}


/***/ })

};
;