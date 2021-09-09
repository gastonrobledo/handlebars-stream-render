const parser = require('./parser'),
      WhitespaceControl = require('./whitespace-control'),
      Helpers = require('./helpers'),
      { extend } = require('../utils'),
      yy = {}

extend(yy, Helpers)

function parseWithoutProcessing(input, options) {
  // Just return if an already-compiled AST was passed in.
  if (input.type === 'Program') {
    return input
  }

  parser.yy = yy

  // Altering the shared object here, but this is ok as parser is a sync operation
  yy.locInfo = function(locInfo) {
    return new yy.SourceLocation(options && options.srcName, locInfo)
  }

  const ast = parser.parse(input)

  return ast
}

function parse(input, options) {
  const ast = parseWithoutProcessing(input, options),
        strip = new WhitespaceControl(options)

  return strip.accept(ast)
}

module.exports = {
  parser,
  parse,
  parseWithoutProcessing
}
