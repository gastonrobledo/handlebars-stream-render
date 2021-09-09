const { appendContextPath, createFrame, isArray } = require('../utils')

module.exports = function hm(instance) {
  instance.registerHelper('blockHelperMissing', function bhm(context, options) {
    const { inverse } = options,
          { fn } = options

    if (context === true) {
      return fn(this)
    } if (context === false || context == null) {
      return inverse(this)
    } if (isArray(context)) {
      if (context.length > 0) {
        if (options.ids) {
          options.ids = [options.name]
        }

        return instance.helpers.each(context, options)
      }
      return inverse(this)

    }
    if (options.data && options.ids) {
      const data = createFrame(options.data)
      data.contextPath = appendContextPath(
        options.data.contextPath,
        options.name
      )
      options = { data }
    }

    return fn(context, options)

  })
}
