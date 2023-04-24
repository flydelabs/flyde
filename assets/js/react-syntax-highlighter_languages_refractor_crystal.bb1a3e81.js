"use strict";
exports.id = 1130;
exports.ids = [1130,369];
exports.modules = {

/***/ 26165:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var refractorRuby = __webpack_require__(38774)
module.exports = crystal
crystal.displayName = 'crystal'
crystal.aliases = []
function crystal(Prism) {
  Prism.register(refractorRuby)
  ;(function(Prism) {
    Prism.languages.crystal = Prism.languages.extend('ruby', {
      keyword: [
        /\b(?:abstract|alias|as|asm|begin|break|case|class|def|do|else|elsif|end|ensure|enum|extend|for|fun|if|include|instance_sizeof|lib|macro|module|next|of|out|pointerof|private|protected|rescue|return|require|select|self|sizeof|struct|super|then|type|typeof|uninitialized|union|unless|until|when|while|with|yield|__DIR__|__END_LINE__|__FILE__|__LINE__)\b/,
        {
          pattern: /(\.\s*)(?:is_a|responds_to)\?/,
          lookbehind: true
        }
      ],
      number: /\b(?:0b[01_]*[01]|0o[0-7_]*[0-7]|0x[\da-fA-F_]*[\da-fA-F]|(?:\d(?:[\d_]*\d)?)(?:\.[\d_]*\d)?(?:[eE][+-]?[\d_]*\d)?)(?:_(?:[uif](?:8|16|32|64))?)?\b/
    })
    Prism.languages.insertBefore('crystal', 'string', {
      attribute: {
        pattern: /@\[.+?\]/,
        alias: 'attr-name',
        inside: {
          delimiter: {
            pattern: /^@\[|\]$/,
            alias: 'tag'
          },
          rest: Prism.languages.crystal
        }
      },
      expansion: [
        {
          pattern: /\{\{.+?\}\}/,
          inside: {
            delimiter: {
              pattern: /^\{\{|\}\}$/,
              alias: 'tag'
            },
            rest: Prism.languages.crystal
          }
        },
        {
          pattern: /\{%.+?%\}/,
          inside: {
            delimiter: {
              pattern: /^\{%|%\}$/,
              alias: 'tag'
            },
            rest: Prism.languages.crystal
          }
        }
      ]
    })
  })(Prism)
}


/***/ }),

/***/ 38774:
/***/ ((module) => {



module.exports = ruby
ruby.displayName = 'ruby'
ruby.aliases = ['rb']
function ruby(Prism) {
  /**
   * Original by Samuel Flores
   *
   * Adds the following new token classes:
   *      constant, builtin, variable, symbol, regex
   */
  ;(function(Prism) {
    Prism.languages.ruby = Prism.languages.extend('clike', {
      comment: [
        /#.*/,
        {
          pattern: /^=begin\s[\s\S]*?^=end/m,
          greedy: true
        }
      ],
      keyword: /\b(?:alias|and|BEGIN|begin|break|case|class|def|define_method|defined|do|each|else|elsif|END|end|ensure|false|for|if|in|module|new|next|nil|not|or|protected|private|public|raise|redo|require|rescue|retry|return|self|super|then|throw|true|undef|unless|until|when|while|yield)\b/
    })
    var interpolation = {
      pattern: /#\{[^}]+\}/,
      inside: {
        delimiter: {
          pattern: /^#\{|\}$/,
          alias: 'tag'
        },
        rest: Prism.languages.ruby
      }
    }
    delete Prism.languages.ruby.function
    Prism.languages.insertBefore('ruby', 'keyword', {
      regex: [
        {
          pattern: /%r([^a-zA-Z0-9\s{(\[<])(?:(?!\1)[^\\]|\\[\s\S])*\1[gim]{0,3}/,
          greedy: true,
          inside: {
            interpolation: interpolation
          }
        },
        {
          pattern: /%r\((?:[^()\\]|\\[\s\S])*\)[gim]{0,3}/,
          greedy: true,
          inside: {
            interpolation: interpolation
          }
        },
        {
          // Here we need to specifically allow interpolation
          pattern: /%r\{(?:[^#{}\\]|#(?:\{[^}]+\})?|\\[\s\S])*\}[gim]{0,3}/,
          greedy: true,
          inside: {
            interpolation: interpolation
          }
        },
        {
          pattern: /%r\[(?:[^\[\]\\]|\\[\s\S])*\][gim]{0,3}/,
          greedy: true,
          inside: {
            interpolation: interpolation
          }
        },
        {
          pattern: /%r<(?:[^<>\\]|\\[\s\S])*>[gim]{0,3}/,
          greedy: true,
          inside: {
            interpolation: interpolation
          }
        },
        {
          pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gim]{0,3}(?=\s*($|[\r\n,.;})]))/,
          lookbehind: true,
          greedy: true
        }
      ],
      variable: /[@$]+[a-zA-Z_]\w*(?:[?!]|\b)/,
      symbol: {
        pattern: /(^|[^:]):[a-zA-Z_]\w*(?:[?!]|\b)/,
        lookbehind: true
      },
      'method-definition': {
        pattern: /(\bdef\s+)[\w.]+/,
        lookbehind: true,
        inside: {
          function: /\w+$/,
          rest: Prism.languages.ruby
        }
      }
    })
    Prism.languages.insertBefore('ruby', 'number', {
      builtin: /\b(?:Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Stat|Fixnum|Float|Hash|Integer|IO|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|String|Struct|TMS|Symbol|ThreadGroup|Thread|Time|TrueClass)\b/,
      constant: /\b[A-Z]\w*(?:[?!]|\b)/
    })
    Prism.languages.ruby.string = [
      {
        pattern: /%[qQiIwWxs]?([^a-zA-Z0-9\s{(\[<])(?:(?!\1)[^\\]|\\[\s\S])*\1/,
        greedy: true,
        inside: {
          interpolation: interpolation
        }
      },
      {
        pattern: /%[qQiIwWxs]?\((?:[^()\\]|\\[\s\S])*\)/,
        greedy: true,
        inside: {
          interpolation: interpolation
        }
      },
      {
        // Here we need to specifically allow interpolation
        pattern: /%[qQiIwWxs]?\{(?:[^#{}\\]|#(?:\{[^}]+\})?|\\[\s\S])*\}/,
        greedy: true,
        inside: {
          interpolation: interpolation
        }
      },
      {
        pattern: /%[qQiIwWxs]?\[(?:[^\[\]\\]|\\[\s\S])*\]/,
        greedy: true,
        inside: {
          interpolation: interpolation
        }
      },
      {
        pattern: /%[qQiIwWxs]?<(?:[^<>\\]|\\[\s\S])*>/,
        greedy: true,
        inside: {
          interpolation: interpolation
        }
      },
      {
        pattern: /("|')(?:#\{[^}]+\}|\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true,
        inside: {
          interpolation: interpolation
        }
      }
    ]
    Prism.languages.rb = Prism.languages.ruby
  })(Prism)
}


/***/ })

};
;