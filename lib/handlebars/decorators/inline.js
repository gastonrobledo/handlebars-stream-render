const { extend } = require('../utils')

module.exports = function(instance) {
  instance.registerDecorator('inline', (fn, props, container, options) => {
    let ret = fn
    if (!props.partials) {
      props.partials = {}
      ret = function(context, options) {
        // Create a new partials stack frame prior to exec.
        const original = container.partials
        container.partials = extend({}, original, props.partials)
        const ret = fn(context, options)
        container.partials = original
        return ret
      }
    }

    props.partials[options.args[0]] = options.fn

    return ret
  })
}
