/* global define */
const { isArray } = require('../utils')

let SourceNode

try {
  /* istanbul ignore next */
  if (typeof define !== 'function' || !define.amd) {
    // We don't support this in AMD environments. For these environments, we asusme that
    // they are running on the browser and thus have no need for the source-map library.
    const SourceMap = require('source-map')
    SourceNode = SourceMap.SourceNode
  }
} catch (err) {
  /* NOP */
}

/* istanbul ignore if: tested but not covered in istanbul due to dist build  */
if (!SourceNode) {
  SourceNode = function(line, column, srcFile, chunks) {
    this.src = ''
    if (chunks) {
      this.add(chunks)
    }
  }
  /* istanbul ignore next */
  SourceNode.prototype = {
    add(chunks) {
      if (isArray(chunks)) {
        chunks = chunks.join('')
      }
      this.src += chunks
    },
    prepend(chunks) {
      if (isArray(chunks)) {
        chunks = chunks.join('')
      }
      this.src = chunks + this.src
    },
    toStringWithSourceMap() {
      return { code: this.toString() }
    },
    toString() {
      return this.src
    }
  }
}

function castChunk(chunk, codeGen, loc) {
  if (isArray(chunk)) {
    const ret = []

    for (let i = 0, len = chunk.length; i < len; i++) {
      ret.push(codeGen.wrap(chunk[i], loc))
    }
    return ret
  } if (typeof chunk === 'boolean' || typeof chunk === 'number') {
    // Handle primitives that the SourceNode will throw up on
    return `${chunk}`
  }
  return chunk
}

function CodeGen(srcFile) {
  this.srcFile = srcFile
  this.source = []
}

CodeGen.prototype = {
  isEmpty() {
    return !this.source.length
  },
  prepend(source, loc) {
    this.source.unshift(this.wrap(source, loc))
  },
  push(source, loc) {
    this.source.push(this.wrap(source, loc))
  },

  merge() {
    const source = this.empty()
    this.each((line) => {
      source.add(['  ', line, '\n'])
    })
    return source
  },

  each(iter) {
    for (let i = 0, len = this.source.length; i < len; i++) {
      iter(this.source[i])
    }
  },

  empty() {
    const loc = this.currentLocation || { start: {} }
    return new SourceNode(loc.start.line, loc.start.column, this.srcFile)
  },
  wrap(chunk, loc = this.currentLocation || { start: {} }) {
    if (chunk instanceof SourceNode) {
      return chunk
    }

    chunk = castChunk(chunk, this, loc)

    return new SourceNode(
      loc.start.line,
      loc.start.column,
      this.srcFile,
      chunk
    )
  },

  functionCall(fn, type, params) {
    params = this.generateList(params)
    return this.wrap([fn, type ? `.${type}(` : '(', params, ')'])
  },

  quotedString(str) {
    return (
      `"${
        (`${str}`)
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\u2028/g, '\\u2028') // Per Ecma-262 7.3 + 7.8.4
          .replace(/\u2029/g, '\\u2029')
      }"`
    )
  },

  objectLiteral(obj) {
    const pairs = []

    Object.keys(obj).forEach((key) => {
      const value = castChunk(obj[key], this)
      if (value !== 'undefined') {
        pairs.push([this.quotedString(key), ':', value])
      }
    })

    const ret = this.generateList(pairs)
    ret.prepend('{')
    ret.add('}')
    return ret
  },

  generateList(entries) {
    const ret = this.empty()

    for (let i = 0, len = entries.length; i < len; i++) {
      if (i) {
        ret.add(',')
      }

      ret.add(castChunk(entries[i], this))
    }

    return ret
  },

  generateArray(entries) {
    const ret = this.generateList(entries)
    ret.prepend('[')
    ret.add(']')

    return ret
  }
}

module.exports = CodeGen
