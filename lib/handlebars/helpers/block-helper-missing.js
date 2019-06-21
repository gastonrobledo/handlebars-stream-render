const { isArray } = require('../utils')

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
        return instance.helpers.each(context, options)
      }
      return inverse(this)

    }
    return fn(context, options)

  })
}
