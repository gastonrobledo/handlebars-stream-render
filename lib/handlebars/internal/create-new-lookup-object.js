const { extend } = require('../utils')

/**
 * Create a new object with "null"-prototype to avoid truthy results on prototype properties.
 * The resulting object can be used with "object[property]" to check if a property exists
 * @param {...object} sources a varargs parameter of source objects that will be merged
 * @returns {object}
 */
function createNewLookupObject(...sources) {
  return extend(Object.create(null), ...sources)
}

module.exports = {
  createNewLookupObject
}
