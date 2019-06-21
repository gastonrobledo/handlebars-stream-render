module.exports = function(instance) {
  instance.registerHelper('lookup', (obj, field) => {
    if (!obj) {
      return obj
    }
    if (field === 'constructor' && !obj.propertyIsEnumerable(field)) {
      return undefined
    }
    return obj[field]
  })
}
