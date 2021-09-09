// USAGE:
// var handlebars = require('handlebars');
/* eslint-disable no-var */

// var local = handlebars.create();

const handlebars = require('./handlebars'),
      printer = require('./handlebars/compiler/printer')

handlebars.PrintVisitor = printer.PrintVisitor
handlebars.print = printer.print

module.exports = handlebars

// Publish a Node.js require() handler for .handlebars and .hbs files
function extension(module, filename) {
  // eslint-disable-next-line global-require
  var fs = require('fs'),
      templateString = fs.readFileSync(filename, 'utf8')
  // eslint-disable-next-line no-param-reassign
  module.exports = handlebars.compile(templateString)
}
/* istanbul ignore else */
if (typeof require !== 'undefined' && require.extensions) {
  require.extensions['.handlebars'] = extension
  require.extensions['.hbs'] = extension
}
