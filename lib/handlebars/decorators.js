const registerInline = require('./decorators/inline')

function registerDefaultDecorators(instance) {
  registerInline(instance)
}
module.exports = {
  registerDefaultDecorators
}
