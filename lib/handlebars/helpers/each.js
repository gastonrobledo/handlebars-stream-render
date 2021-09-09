const { Stream, Transform } = require('stream'),
      pump = require('pump'),
      {
        createFrame, isArray, isFunction, isPromise, Counter, blockParams, appendContextPath
      } = require('../utils'),
      Exception = require('../exception')

module.exports = function(instance) {
  instance.registerHelper('each', async function(context, options) {
    if (!options) {
      throw new Exception('Must pass iterator to #each')
    }

    let { fn } = options,
        { inverse } = options,
        i = 0,
        ret = '',
        data,
        contextPath

    if (options.data && options.ids) {
      contextPath = appendContextPath(options.data.contextPath, options.ids[0]) + '.'
    }

    if (isFunction(context)) { context = context.call(this) }

    if (isPromise(context)) {
      // eslint-disable no-param-reassign
      context = await context
    }

    if (options.data) {
      data = createFrame(options.data)
    }

    async function execIteration(field, index, last) {
      if (data) {
        data.key = field
        data.index = index
        data.first = index === 0
        data.last = !!last

        if (contextPath) {
          data.contextPath = contextPath + field
        }
      }

      ret += await fn(context[field], {
        data,
        blockParams: blockParams(
          [context[field], field],
          [contextPath + field, null]
        )
      })
    }

    if (context instanceof Stream) {
      await (new Promise((resolve, reject) => {
        const transform = new Transform({
          objectMode: true,
          transform(chunk, enc, cb) {
            const { first, last, counter } = chunk
            if (data) {
              data.key = counter
              data.index = counter
              data.first = first
              data.last = last
            }
            fn(chunk.data, {
              data,
              blockParams: blockParams(
                [chunk.data, counter],
                [contextPath + chunk.data, null]
              )
            }).then(() => cb()).catch(e => cb(e))
          }
        })
        pump(context, Counter(), transform, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      }))
    } else if (context && typeof context === 'object') {
      if (isArray(context)) {
        // eslint-disable-next-line no-plusplus
        for (let j = context.length; i < j; i++) {
          if (i in context) {
            // eslint-disable-next-line no-await-in-loop
            await execIteration(i, i, i === context.length - 1)
          }
        }
      } else if (global.Symbol && context[global.Symbol.iterator]) {
        const newContext = [],
              iterator = context[global.Symbol.iterator]()
        for (let it = iterator.next(); !it.done; it = iterator.next()) {
          newContext.push(it.value)
        }
        context = newContext
        // eslint-disable-next-line no-plusplus
        for (let j = context.length; i < j; i++) {
          // eslint-disable-next-line no-await-in-loop
          await execIteration(i, i, i === context.length - 1)
        }
      } else {
        let priorKey

        // eslint-disable-next-line no-restricted-syntax
        for (const key in context) {
          if (context.hasOwnProperty(key)) {
            // We're running the iterations one step out of sync so we can detect
            // the last iteration without have to scan the object twice and create
            // an itermediate keys array.
            if (priorKey !== undefined) {
              // eslint-disable-next-line no-await-in-loop
              await execIteration(priorKey, i - 1)
            }
            priorKey = key
            i++
          }
        }
        if (priorKey !== undefined) {
          await execIteration(priorKey, i - 1, true)
        }
      }
    }

    if (i === 0) {
      ret = inverse(this)
    }

    return ret
  })
}
