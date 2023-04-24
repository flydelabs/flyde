"use strict";
exports.id = 2584;
exports.ids = [2584,3047,369];
exports.modules = {

/***/ 84166:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var refractorMarkupTemplating = __webpack_require__(47058)
var refractorRuby = __webpack_require__(38774)
module.exports = erb
erb.displayName = 'erb'
erb.aliases = []
function erb(Prism) {
  Prism.register(refractorMarkupTemplating)
  Prism.register(refractorRuby)
  ;(function(Prism) {
    Prism.languages.erb = Prism.languages.extend('ruby', {})
    Prism.languages.insertBefore('erb', 'comment', {
      delimiter: {
        pattern: /^<%=?|%>$/,
        alias: 'punctuation'
      }
    })
    Prism.hooks.add('before-tokenize', function(env) {
      var erbPattern = /<%=?(?:[^\r\n]|[\r\n](?!=begin)|[\r\n]=begin\s[\s\S]*?^=end)+?%>/gm
      Prism.languages['markup-templating'].buildPlaceholders(
        env,
        'erb',
        erbPattern
      )
    })
    Prism.hooks.add('after-tokenize', function(env) {
      Prism.languages['markup-templating'].tokenizePlaceholders(env, 'erb')
    })
  })(Prism)
}


/***/ }),

/***/ 47058:
/***/ ((module) => {



module.exports = markupTemplating
markupTemplating.displayName = 'markupTemplating'
markupTemplating.aliases = []
function markupTemplating(Prism) {
  ;(function(Prism) {
    /**
     * Returns the placeholder for the given language id and index.
     *
     * @param {string} language
     * @param {string|number} index
     * @returns {string}
     */
    function getPlaceholder(language, index) {
      return '___' + language.toUpperCase() + index + '___'
    }
    Object.defineProperties((Prism.languages['markup-templating'] = {}), {
      buildPlaceholders: {
        /**
         * Tokenize all inline templating expressions matching `placeholderPattern`.
         *
         * If `replaceFilter` is provided, only matches of `placeholderPattern` for which `replaceFilter` returns
         * `true` will be replaced.
         *
         * @param {object} env The environment of the `before-tokenize` hook.
         * @param {string} language The language id.
         * @param {RegExp} placeholderPattern The matches of this pattern will be replaced by placeholders.
         * @param {(match: string) => boolean} [replaceFilter]
         */
        value: function(env, language, placeholderPattern, replaceFilter) {
          if (env.language !== language) {
            return
          }
          var tokenStack = (env.tokenStack = [])
          env.code = env.code.replace(placeholderPattern, function(match) {
            if (typeof replaceFilter === 'function' && !replaceFilter(match)) {
              return match
            }
            var i = tokenStack.length
            var placeholder // Check for existing strings
            while (
              env.code.indexOf((placeholder = getPlaceholder(language, i))) !==
              -1
            )
              ++i // Create a sparse array
            tokenStack[i] = match
            return placeholder
          }) // Switch the grammar to markup
          env.grammar = Prism.languages.markup
        }
      },
      tokenizePlaceholders: {
        /**
         * Replace placeholders with proper tokens after tokenizing.
         *
         * @param {object} env The environment of the `after-tokenize` hook.
         * @param {string} language The language id.
         */
        value: function(env, language) {
          if (env.language !== language || !env.tokenStack) {
            return
          } // Switch the grammar back
          env.grammar = Prism.languages[language]
          var j = 0
          var keys = Object.keys(env.tokenStack)
          function walkTokens(tokens) {
            for (var i = 0; i < tokens.length; i++) {
              // all placeholders are replaced already
              if (j >= keys.length) {
                break
              }
              var token = tokens[i]
              if (
                typeof token === 'string' ||
                (token.content && typeof token.content === 'string')
              ) {
                var k = keys[j]
                var t = env.tokenStack[k]
                var s = typeof token === 'string' ? token : token.content
                var placeholder = getPlaceholder(language, k)
                var index = s.indexOf(placeholder)
                if (index > -1) {
                  ++j
                  var before = s.substring(0, index)
                  var middle = new Prism.Token(
                    language,
                    Prism.tokenize(t, env.grammar),
                    'language-' + language,
                    t
                  )
                  var after = s.substring(index + placeholder.length)
                  var replacement = []
                  if (before) {
                    replacement.push.apply(replacement, walkTokens([before]))
                  }
                  replacement.push(middle)
                  if (after) {
                    replacement.push.apply(replacement, walkTokens([after]))
                  }
                  if (typeof token === 'string') {
                    tokens.splice.apply(tokens, [i, 1].concat(replacement))
                  } else {
                    token.content = replacement
                  }
                }
              } else if (
                token.content
                /* && typeof token.content !== 'string' */
              ) {
                walkTokens(token.content)
              }
            }
            return tokens
          }
          walkTokens(env.tokens)
        }
      }
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