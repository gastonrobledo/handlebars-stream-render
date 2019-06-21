const { isEmpty, isFunction, isPromise } = require('../utils')

module.exports = function(instance) {
  instance.registerHelper('with', async function(context, options) {
    if (isFunction(context)) { context = context.call(this) }

    if(isPromise(context)) {
      context = await context
    }
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
