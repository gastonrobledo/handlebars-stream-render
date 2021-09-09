module.exports = function(instance) {
  instance.registerHelper('lookup', (obj, field, options) => {
    if (!obj) {
      // Note for 5.0: Change to "obj == null" in 5.0
      return obj
    }
    return options.lookupProperty(obj, field)
  })
}
