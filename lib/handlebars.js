// Compiler imports
const AST = require('./handlebars/compiler/ast'),
      {
        parser: Parser,
        parse,
        parseWithoutProcessing
      } = require('./handlebars/compiler/base'),
      { Compiler, compile, precompile } = require('./handlebars/compiler/compiler'),
      JavaScriptCompiler = require('./handlebars/compiler/javascript-compiler'),
      Visitor = require('./handlebars/compiler/visitor'),
      runtime = require('./handlebars.runtime'),
      noConflict = require('./handlebars/no-conflict'),
      // eslint-disable-next-line no-underscore-dangle
      _create = runtime.create


function create(stream = null) {
  const hb = _create()
  hb.stream = stream

  hb.compile = (input, options, context) => compile(input, options, hb, context)
  hb.precompile = (input, options) => precompile(input, options, hb)

  hb.AST = AST
  hb.Compiler = Compiler
  hb.JavaScriptCompiler = JavaScriptCompiler
  hb.Parser = Parser
  hb.parse = parse
  hb.parseWithoutProcessing = parseWithoutProcessing

  return hb
}

// eslint-disable-next-line one-var
const inst = create()
inst.create = create

noConflict(inst)

inst.Visitor = Visitor

inst.default = inst

module.exports = inst
