const registerBlockHelperMissing = require('./helpers/block-helper-missing'),
      registerEach = require('./helpers/each'),
      registerHelperMissing = require('./helpers/helper-missing'),
      registerIf = require('./helpers/if'),
      registerLog = require('./helpers/log'),
      registerLookup = require('./helpers/lookup'),
      registerWith = require('./helpers/with'),
      registerExtend = require('./helpers/extend'),
      registerBlock = require('./helpers/block')

function registerDefaultHelpers(instance) {
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

function moveHelperToHooks(instance, helperName, keepHelper) {
  if (instance.helpers[helperName]) {
    instance.hooks[helperName] = instance.helpers[helperName]
    if (!keepHelper) {
      delete instance.helpers[helperName]
    }
  }
}

module.exports = {
  registerDefaultHelpers,
  moveHelperToHooks
}
