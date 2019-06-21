const Exception = require('../exception')

function Visitor() {
  this.parents = []
}

Visitor.prototype = {
  constructor: Visitor,
  mutating: false,

  // Visits a given value. If mutating, will replace the value if necessary.
  acceptKey(node, name) {
    const value = this.accept(node[name])
    if (this.mutating) {
      // Hacky sanity check: This may have a few false positives for type for the helper
      // methods but will generally do the right thing without a lot of overhead.
      if (value && !Visitor.prototype[value.type]) {
        throw new Exception(`Unexpected node type "${value.type}" found when accepting ${name} on ${node.type}`)
      }
      node[name] = value
    }
  },

  // Performs an accept operation with added sanity check to ensure
  // required keys are not removed.
  acceptRequired(node, name) {
    this.acceptKey(node, name)

    if (!node[name]) {
      throw new Exception(`${node.type} requires ${name}`)
    }
  },

  // Traverses a given array. If mutating, empty respnses will be removed
  // for child elements.
  acceptArray(array) {
    for (let i = 0, l = array.length; i < l; i++) {
      this.acceptKey(array, i)

      if (!array[i]) {
        array.splice(i, 1)
        i--
        l--
      }
    }
  },

  accept(object) {
    if (!object) {
      return
    }

    /* istanbul ignore next: Sanity code */
    if (!this[object.type]) {
      throw new Exception(`Unknown type: ${object.type}`, object)
    }

    if (this.current) {
      this.parents.unshift(this.current)
    }
    this.current = object

    const ret = this[object.type](object)

    this.current = this.parents.shift()

    if (!this.mutating || ret) {
      return ret
    } if (ret !== false) {
      return object
    }
  },

  Program(program) {
    this.acceptArray(program.body)
  },

  MustacheStatement: visitSubExpression,
  Decorator: visitSubExpression,

  BlockStatement: visitBlock,
  DecoratorBlock: visitBlock,

  PartialStatement: visitPartial,
  PartialBlockStatement(partial) {
    visitPartial.call(this, partial)

    this.acceptKey(partial, 'program')
  },

  ContentStatement(/* content */) {},
  CommentStatement(/* comment */) {},

  SubExpression: visitSubExpression,

  PathExpression(/* path */) {},

  StringLiteral(/* string */) {},
  NumberLiteral(/* number */) {},
  BooleanLiteral(/* bool */) {},
  UndefinedLiteral(/* literal */) {},
  NullLiteral(/* literal */) {},

  Hash(hash) {
    this.acceptArray(hash.pairs)
  },
  HashPair(pair) {
    this.acceptRequired(pair, 'value')
  }
}

function visitSubExpression(mustache) {
  this.acceptRequired(mustache, 'path')
  this.acceptArray(mustache.params)
  this.acceptKey(mustache, 'hash')
}
function visitBlock(block) {
  visitSubExpression.call(this, block)

  this.acceptKey(block, 'program')
  this.acceptKey(block, 'inverse')
}
function visitPartial(partial) {
  this.acceptRequired(partial, 'name')
  this.acceptArray(partial.params)
  this.acceptKey(partial, 'hash')
}

module.exports = Visitor
