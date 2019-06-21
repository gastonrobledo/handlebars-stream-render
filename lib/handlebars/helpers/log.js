module.exports = function(instance) {
  instance.registerHelper('log', function(/* message, options */) {
    const args = [undefined],
          options = arguments[arguments.length - 1]
    for (let i = 0; i < arguments.length - 1; i++) {
      args.push(arguments[i])
    }

    let level = 1
    if (options.hash.level != null) {
      level = options.hash.level
    } else if (options.data && options.data.level != null) {
      level = options.data.level
    }
    args[0] = level

    instance.log(...args)
  })
}
