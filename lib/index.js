const fs = require('fs'),
      handlebars = require('./handlebars').default,
      printer = require('./handlebars/compiler/printer')

handlebars.PrintVisitor = printer.PrintVisitor
handlebars.print = printer.print

module.exports = handlebars

// Publish a Node.js require() handler for .handlebars and .hbs files
function extension(module, filename) {
  const templateString = fs.readFileSync(filename, 'utf8')
  /* eslint-disable no-param-reassign */
  module.exports = handlebars.compile(templateString)
}
/* istanbul ignore else */
if (typeof require !== 'undefined' && require.extensions) {
  require.extensions['.handlebars'] = extension
  require.extensions['.hbs'] = extension
}
