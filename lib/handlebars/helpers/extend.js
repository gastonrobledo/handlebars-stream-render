module.exports = function(instance) {
  instance.registerHelper('extend', async function(partial, options) {
    const context = this
    let template = instance.partials[partial]
    // Partial template required
    if (typeof template === 'undefined') {
      throw new Error(`Missing layout partial: '${partial}'`)
    }
    context.discard = true
    await options.fn(context)
    // Parse blocks and discard output

    if (typeof template === 'string') {
      template = instance.compile(template, {}, context)
    }

    // Render final layout partial with revised blocks
    context.discard = false
    return template(context, options)
  })
}
