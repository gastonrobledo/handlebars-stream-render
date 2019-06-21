const registerBlockHelperMissing = require('./helpers/block-helper-missing'),
      registerEach = require('./helpers/each'),
      registerHelperMissing = require('./helpers/helper-missing'),
      registerIf = require('./helpers/if'),
      registerLog = require('./helpers/log'),
      registerLookup = require('./helpers/lookup'),
      registerWith = require('./helpers/with'),
      registerExtend = require('./helpers/extend'),
      registerBlock = require('./helpers/block')

module.exports = function registerDefaultHelpers(instance) {
  registerBlockHelperMissing(instance)
  registerEach(instance)
  registerHelperMissing(instance)
  registerIf(instance)
  registerLog(instance)
  registerLookup(instance)
  registerWith(instance)
  registerBlock(instance)
  registerExtend(instance)
}
