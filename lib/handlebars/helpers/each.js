const { Stream, Transform } = require('stream'),
      pump = require('pump'),
      {
        createFrame, isArray, isFunction, isPromise, Counter
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
        data

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
      }

      ret += await fn(context[field], {
        data,
        blockParams: [context[field], field]
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
              blockParams: [chunk.data, counter]
            }).then(() => cb()).catch(e => cb(e))
          }
        })
        pump(context, Counter(), transform, (err) => {
          if (err) {
            reject()
          } else {
            resolve()
          }
        })
      }))
    } else if (context && typeof context === 'object') {
      if (isArray(context)) {
        for (let j = context.length; i < j; i++) {
          if (i in context) {
            await execIteration(i, i, i === context.length - 1)
          }
        }
      } else {
        let priorKey

        for (const key in context) {
          if (context.hasOwnProperty(key)) {
            // We're running the iterations one step out of sync so we can detect
            // the last iteration without have to scan the object twice and create
            // an itermediate keys array.
            if (priorKey !== undefined) {
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
