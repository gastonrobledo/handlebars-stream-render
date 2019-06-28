/* eslint-disable no-param-reassign */
/* eslint-disable prefer-arrow-callback */
module.exports = function(instance) {
  instance.registerHelper('block', function block(name, options) {
    instance.blocks = instance.blocks || {}
    const blk = instance.blocks[name]
    let result
    switch (blk && blk.fn && blk.should) {
      case 'append':
        result = options.fn(this).then(r => blk.fn(this).then(x => r + x))
        break
      case 'prepend':
        result = blk.fn(this).then(r => options.fn(this).then(x => r + x))
        break
      case 'replace':
        result = blk.fn(this)
        break
      default:
        result = options.fn(this)
    }
    return result
  })
  instance.registerHelper('append', function append(block, options) {
    instance.blocks = instance.blocks || {}
    instance.blocks[block] = {
      should: 'append',
      fn: options.fn
    }
  })
  instance.registerHelper('prepend', function prepend(block, options) {
    instance.blocks = instance.blocks || {}
    instance.blocks[block] = {
      should: 'prepend',
      fn: options.fn
    }
  })
  instance.registerHelper('replace', function replace(block, options) {
    instance.blocks = instance.blocks || {}
    instance.blocks[block] = {
      should: 'replace',
      fn: options.fn
    }
  })
}
