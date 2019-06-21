const { isEmpty, isFunction } = require('../utils')

module.exports = function(instance) {
  instance.registerHelper('with', function(context, options) {
    if (isFunction(context)) { context = context.call(this) }

    const { fn } = options

    if (!isEmpty(context)) {
      const { data } = options

      return fn(context, {
        data,
        blockParams: [context]
      })
    }
    return options.inverse(this)

  })
}
