// Compiler imports
/* eslint-disable no-underscore-dangle */
const AST = require('./handlebars/compiler/ast'),
      Parser = require('./handlebars/compiler/base'),
      { Compiler, compile, precompile } = require('./handlebars/compiler/compiler'),
      JavaScriptCompiler = require('./handlebars/compiler/javascript-compiler'),
      Visitor = require('./handlebars/compiler/visitor'),
      noConflict = require('./handlebars/no-conflict'),
      runtime = require('./handlebars.runtime'),
      { parse } = Parser,
      _create = runtime.create

function create(stream) {
  const hb = _create()
  hb.stream = stream

  hb.compile = function cmp(input, options, context) {
    return compile(input, options, hb, context)
  }
  hb.precompile = function precmp(input, options) {
    return precompile(input, options, hb)
  }

  hb.AST = AST
  hb.Compiler = Compiler
  hb.JavaScriptCompiler = JavaScriptCompiler
  hb.Parser = Parser
  hb.parse = parse

  return hb
}

const inst = create()
inst.create = create

noConflict(inst)

inst.Visitor = Visitor

inst.default = inst

module.exports = inst
