const registerInline = require('./decorators/inline')

module.exports = function registerDefaultDecorators(instance) {
  registerInline(instance)
}
