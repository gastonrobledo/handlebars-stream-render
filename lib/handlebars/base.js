const { createFrame, extend, toString } = require('./utils'),
      Exception = require('./exception'),
      { registerDefaultHelpers } = require('./helpers'),
      { registerDefaultDecorators } = require('./decorators'),
      logger = require('./logger'),
      { resetLoggedProperties } = require('./internal/proto-access'),

      VERSION = '4.7.7',
      COMPILER_REVISION = 8,
      LAST_COMPATIBLE_COMPILER_REVISION = 7,
      REVISION_CHANGES = {
        1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
        2: '== 1.0.0-rc.3',
        3: '== 1.0.0-rc.4',
        4: '== 1.x.x',
        5: '== 2.0.0-alpha.x',
        6: '>= 2.0.0-beta.1',
        7: '>= 4.0.0 <4.3.0',
        8: '>= 4.3.0'
      },

      objectType = '[object Object]',
      { log } = logger

function HandlebarsEnvironment(helpers, partials, decorators) {
  this.helpers = helpers || {}
  this.partials = partials || {}
  this.decorators = decorators || {}

  registerDefaultHelpers(this)
  registerDefaultDecorators(this)
}

HandlebarsEnvironment.prototype = {
  constructor: HandlebarsEnvironment,

  logger,
  log: logger.log,

  registerHelper(name, fn) {
    if (toString.call(name) === objectType) {
      if (fn) {
        throw new Exception('Arg not supported with multiple helpers')
      }
      extend(this.helpers, name)
    } else {
      this.helpers[name] = fn
    }
  },
  unregisterHelper(name) {
    delete this.helpers[name]
  },

  registerPartial(name, partial) {
    if (toString.call(name) === objectType) {
      extend(this.partials, name)
    } else {
      if (typeof partial === 'undefined') {
        throw new Exception(
          `Attempting to register a partial called "${name}" as undefined`
        )
      }
      this.partials[name] = partial
    }
  },
  unregisterPartial(name) {
    delete this.partials[name]
  },

  registerDecorator(name, fn) {
    if (toString.call(name) === objectType) {
      if (fn) {
        throw new Exception('Arg not supported with multiple decorators')
      }
      extend(this.decorators, name)
    } else {
      this.decorators[name] = fn
    }
  },
  unregisterDecorator(name) {
    delete this.decorators[name]
  },
  /**
   * Reset the memory of illegal property accesses that have already been logged.
   * @deprecated should only be used in handlebars test-cases
   */
  resetLoggedPropertyAccesses() {
    resetLoggedProperties()
  }
}

module.exports = {
  VERSION,
  COMPILER_REVISION,
  LAST_COMPATIBLE_COMPILER_REVISION,
  REVISION_CHANGES,
  HandlebarsEnvironment,
  log,
  createFrame,
  logger
}
