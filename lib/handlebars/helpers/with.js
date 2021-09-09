const {
        appendContextPath,
        blockParams,
        createFrame,
        isEmpty,
        isFunction,
        isPromise
      } = require('../utils'),
      Exception = require('../exception')

module.exports = function(instance) {
  instance.registerHelper('with', async function(context, options) {
    if (arguments.length !== 2) {
      throw new Exception('#with requires exactly one argument')
    }
    if (isFunction(context)) {
      context = context.call(this)
    }
    if (isPromise(context)) {
      context = await context
    }

    const { fn } = options

    if (!isEmpty(context)) {
      let { data } = options
      if (options.data && options.ids) {
        data = createFrame(options.data)
        data.contextPath = appendContextPath(
          options.data.contextPath,
          options.ids[0]
        )
      }

      return fn(context, {
        data,
        blockParams: blockParams([context], [data && data.contextPath])
      })
    }
    return options.inverse(this)

  })
}
