/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable one-var */
const errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack']

function Exception(message, node) {
  const loc = node && node.loc
  let line,
      column
  if (loc) {
    line = loc.start.line
    column = loc.start.column

    message += ` - ${line}:${column}`
  }

  const tmp = Error.prototype.constructor.call(this, message)

  // Unfortunately errors are not enumerable in Chrome (at least),
  // so `for prop in tmp` doesn't work.
  for (let idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]]
  }

  /* istanbul ignore else */
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, Exception)
  }

  try {
    if (loc) {
      this.lineNumber = line

      // Work around issue under safari where we can't directly set the column value
      /* istanbul ignore next */
      if (Object.defineProperty) {
        Object.defineProperty(this, 'column', {
          value: column,
          enumerable: true
        })
      } else {
        this.column = column
      }
    }
  } catch (nop) {
    /* Ignore if the browser is very particular */
  }
}

Exception.prototype = new Error()

module.exports = Exception
