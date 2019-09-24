/* eslint-disable prefer-rest-params */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
const { Transform } = require('stream')


const escape = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;',
        '=': '&#x3D;'
      },

      badChars = /[&<>"'`=]/g,
      possible = /[&<>"'`=]/,
      { toString } = Object.prototype

function escapeChar(chr) {
  return escape[chr]
}

function extend(obj/* , ...source */) {
  for (let i = 1; i < arguments.length; i++) {
    for (const key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        obj[key] = arguments[i][key]
      }
    }
  }

  return obj
}


// Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
/* eslint-disable func-style */
let isFunction = function(value) {
  return typeof value === 'function'
}
// fallback for older versions of Chrome and Safari
/* istanbul ignore next */
if (isFunction(/x/)) {
  isFunction = function(value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]'
  }
}
/* eslint-enable func-style */

/* istanbul ignore next */
const isArray = Array.isArray || function(value) {
  return (value && typeof value === 'object') ? toString.call(value) === '[object Array]' : false
}

// Older IE versions do not directly support indexOf so we must implement our own, sadly.
function indexOf(array, value) {
  for (let i = 0, len = array.length; i < len; i++) {
    if (array[i] === value) {
      return i
    }
  }
  return -1
}


function escapeExpression(string) {
  if (typeof string !== 'string') {
    // don't escape SafeStrings, since they're already safe
    if (string && string.toHTML) {
      return string.toHTML()
    } if (string == null) {
      return ''
    } if (!string) {
      return `${string}`
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = `${string}`
  }

  if (!possible.test(string)) { return string }
  return string.replace(badChars, escapeChar)
}

function isEmpty(value) {
  if (!value && value !== 0) {
    return true
  } if (isArray(value) && value.length === 0) {
    return true
  }
  return false

}

function createFrame(object) {
  const frame = extend({}, object)
  frame._parent = object
  return frame
}

function isPromise(obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'
}

const COUNTER_NULL_SYMBOL = Symbol('COUNTER_NULL_SYMBOL'),
      Counter = () => {
        let data = COUNTER_NULL_SYMBOL,
            counter = 1,
            first = true

        const counterStream = new Transform({

          objectMode: true,
          decodeStrings: false,
          highWaterMark: 1,

          transform(chunk, encoding, callback) {
            if (data === COUNTER_NULL_SYMBOL) {
              data = chunk
              return callback()
            }
            this.push({
              data, counter, last: false, first
            })
            first = false
            counter += 1
            data = chunk

            return callback()

          },
        })
        /* eslint-disable no-underscore-dangle */
        counterStream._flush = function(callback) {
          if (data === COUNTER_NULL_SYMBOL) {
            return callback()
          }
          this.push({
            data, counter, last: true, first
          })
          return callback()

        }

        return counterStream
      }


module.exports = {
  createFrame,
  isEmpty,
  escapeExpression,
  indexOf,
  isArray,
  isFunction,
  extend,
  isPromise,
  Counter
}
