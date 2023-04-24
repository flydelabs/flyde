"use strict";
exports.id = 849;
exports.ids = [849,3047];
exports.modules = {

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

/***/ 76128:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var refractorMarkupTemplating = __webpack_require__(47058)
module.exports = smarty
smarty.displayName = 'smarty'
smarty.aliases = []
function smarty(Prism) {
  Prism.register(refractorMarkupTemplating)
  /* TODO
Add support for variables inside double quoted strings
Add support for {php}
*/
  ;(function(Prism) {
    Prism.languages.smarty = {
      comment: /\{\*[\s\S]*?\*\}/,
      delimiter: {
        pattern: /^\{|\}$/i,
        alias: 'punctuation'
      },
      string: /(["'])(?:\\.|(?!\1)[^\\\r\n])*\1/,
      number: /\b0x[\dA-Fa-f]+|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][-+]?\d+)?/,
      variable: [
        /\$(?!\d)\w+/,
        /#(?!\d)\w+#/,
        {
          pattern: /(\.|->)(?!\d)\w+/,
          lookbehind: true
        },
        {
          pattern: /(\[)(?!\d)\w+(?=\])/,
          lookbehind: true
        }
      ],
      function: [
        {
          pattern: /(\|\s*)@?(?!\d)\w+/,
          lookbehind: true
        },
        /^\/?(?!\d)\w+/,
        /(?!\d)\w+(?=\()/
      ],
      'attr-name': {
        // Value is made optional because it may have already been tokenized
        pattern: /\w+\s*=\s*(?:(?!\d)\w+)?/,
        inside: {
          variable: {
            pattern: /(=\s*)(?!\d)\w+/,
            lookbehind: true
          },
          operator: /=/
        }
      },
      punctuation: [/[\[\]().,:`]|->/],
      operator: [
        /[+\-*\/%]|==?=?|[!<>]=?|&&|\|\|?/,
        /\bis\s+(?:not\s+)?(?:div|even|odd)(?:\s+by)?\b/,
        /\b(?:eq|neq?|gt|lt|gt?e|lt?e|not|mod|or|and)\b/
      ],
      keyword: /\b(?:false|off|on|no|true|yes)\b/
    } // Tokenize all inline Smarty expressions
    Prism.hooks.add('before-tokenize', function(env) {
      var smartyPattern = /\{\*[\s\S]*?\*\}|\{[\s\S]+?\}/g
      var smartyLitteralStart = '{literal}'
      var smartyLitteralEnd = '{/literal}'
      var smartyLitteralMode = false
      Prism.languages['markup-templating'].buildPlaceholders(
        env,
        'smarty',
        smartyPattern,
        function(match) {
          // Smarty tags inside {literal} block are ignored
          if (match === smartyLitteralEnd) {
            smartyLitteralMode = false
          }
          if (!smartyLitteralMode) {
            if (match === smartyLitteralStart) {
              smartyLitteralMode = true
            }
            return true
          }
          return false
        }
      )
    }) // Re-insert the tokens after tokenizing
    Prism.hooks.add('after-tokenize', function(env) {
      Prism.languages['markup-templating'].tokenizePlaceholders(env, 'smarty')
    })
  })(Prism)
}


/***/ })

};
;