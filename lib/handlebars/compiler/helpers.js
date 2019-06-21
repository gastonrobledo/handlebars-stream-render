const Exception = require('../exception')

function validateClose(open, close) {
  close = close.path ? close.path.original : close

  if (open.path.original !== close) {
    const errorNode = { loc: open.path.loc }

    throw new Exception(`${open.path.original} doesn't match ${close}`, errorNode)
  }
}

function SourceLocation(source, locInfo) {
  this.source = source
  this.start = {
    line: locInfo.first_line,
    column: locInfo.first_column
  }
  this.end = {
    line: locInfo.last_line,
    column: locInfo.last_column
  }
}

function id(token) {
  if (/^\[.*\]$/.test(token)) {
    return token.substring(1, token.length - 1)
  }
  return token

}

function stripFlags(open, close) {
  return {
    open: open.charAt(2) === '~',
    close: close.charAt(close.length - 3) === '~'
  }
}

function stripComment(comment) {
  return comment.replace(/^\{\{~?!-?-?/, '')
    .replace(/-?-?~?\}\}$/, '')
}

function preparePath(data, parts, loc) {
  loc = this.locInfo(loc)

  let original = data ? '@' : '',
      dig = [],
      depth = 0

  for (let i = 0, l = parts.length; i < l; i++) {
    const { part } = parts[i],
          // If we have [] syntax then we do not treat path references as operators,
          // i.e. foo.[this] resolves to approximately context.foo['this']
          isLiteral = parts[i].original !== part
    original += (parts[i].separator || '') + part

    if (!isLiteral && (part === '..' || part === '.' || part === 'this')) {
      if (dig.length > 0) {
        throw new Exception(`Invalid path: ${original}`, { loc })
      } else if (part === '..') {
        depth++
      }
    } else {
      dig.push(part)
    }
  }

  return {
    type: 'PathExpression',
    data,
    depth,
    parts: dig,
    original,
    loc
  }
}

function prepareMustache(path, params, hash, open, strip, locInfo) {
  // Must use charAt to support IE pre-10
  const escapeFlag = open.charAt(3) || open.charAt(2),
        escaped = escapeFlag !== '{' && escapeFlag !== '&',

        decorator = (/\*/.test(open))
  return {
    type: decorator ? 'Decorator' : 'MustacheStatement',
    path,
    params,
    hash,
    escaped,
    strip,
    loc: this.locInfo(locInfo)
  }
}

function prepareRawBlock(openRawBlock, contents, close, locInfo) {
  validateClose(openRawBlock, close)

  locInfo = this.locInfo(locInfo)
  const program = {
    type: 'Program',
    body: contents,
    strip: {},
    loc: locInfo
  }

  return {
    type: 'BlockStatement',
    path: openRawBlock.path,
    params: openRawBlock.params,
    hash: openRawBlock.hash,
    program,
    openStrip: {},
    inverseStrip: {},
    closeStrip: {},
    loc: locInfo
  }
}

function prepareBlock(openBlock, program, inverseAndProgram, close, inverted, locInfo) {
  if (close && close.path) {
    validateClose(openBlock, close)
  }

  const decorator = (/\*/.test(openBlock.open))

  program.blockParams = openBlock.blockParams

  let inverse,
      inverseStrip

  if (inverseAndProgram) {
    if (decorator) {
      throw new Exception('Unexpected inverse block on decorator', inverseAndProgram)
    }

    if (inverseAndProgram.chain) {
      inverseAndProgram.program.body[0].closeStrip = close.strip
    }

    inverseStrip = inverseAndProgram.strip
    inverse = inverseAndProgram.program
  }

  if (inverted) {
    inverted = inverse
    inverse = program
    program = inverted
  }

  return {
    type: decorator ? 'DecoratorBlock' : 'BlockStatement',
    path: openBlock.path,
    params: openBlock.params,
    hash: openBlock.hash,
    program,
    inverse,
    openStrip: openBlock.strip,
    inverseStrip,
    closeStrip: close && close.strip,
    loc: this.locInfo(locInfo)
  }
}

function prepareProgram(statements, loc) {
  if (!loc && statements.length) {
    const firstLoc = statements[0].loc,
          lastLoc = statements[statements.length - 1].loc

    /* istanbul ignore else */
    if (firstLoc && lastLoc) {
      loc = {
        source: firstLoc.source,
        start: {
          line: firstLoc.start.line,
          column: firstLoc.start.column
        },
        end: {
          line: lastLoc.end.line,
          column: lastLoc.end.column
        }
      }
    }
  }

  return {
    type: 'Program',
    body: statements,
    strip: {},
    loc
  }
}

function preparePartialBlock(open, program, close, locInfo) {
  validateClose(open, close)

  return {
    type: 'PartialBlockStatement',
    name: open.path,
    params: open.params,
    hash: open.hash,
    program,
    openStrip: open.strip,
    closeStrip: close && close.strip,
    loc: this.locInfo(locInfo)
  }
}

module.exports = {
  SourceLocation,
  id,
  stripFlags,
  stripComment,
  preparePath,
  prepareMustache,
  prepareRawBlock,
  prepareBlock,
  prepareProgram,
  preparePartialBlock
}
