
module.exports = function(instance) {
  instance.registerHelper('block', function(name, options) {
    this.blocks = this.blocks || {}
    const blk = this.blocks[name]
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
  instance.registerHelper('append', function(block, options) {
    this.blocks = this.blocks || {}
    this.blocks[block] = {
      should: 'append',
      fn: options.fn
    }
  })
  instance.registerHelper('prepend', function(block, options) {
    this.blocks = this.blocks || {}
    this.blocks[block] = {
      should: 'prepend',
      fn: options.fn
    }
  })
  instance.registerHelper('replace', function(block, options) {
    this.blocks = this.blocks || {}
    this.blocks[block] = {
      should: 'replace',
      fn: options.fn
    }
  })
}
