const base = require('./handlebars/base'),
      // Each of these augment the Handlebars object. No need to setup here.
      // (This is done to easily share code between commonjs and browse envs)
      SafeString = require('./handlebars/safe-string'),
      Exception = require('./handlebars/exception'),
      Utils = require('./handlebars/utils'),
      runtime = require('./handlebars/runtime'),

      noConflict = require('./handlebars/no-conflict')
async function processResult(result, output) {
  let value = result
  if (Utils.isPromise(value)) {
    value = await value
  }
  // eslint-disable-next-line no-restricted-globals
  if (value !== null && (!isNaN(value) || (typeof value === 'string' && value.indexOf('∆') < 0))) {
    if (!output) {
      return value
    }
    output.write(value.toString())
  }
  if (value === null && output) {
    output.end()
  }
}

function wrapTemplate(env, compiledFuncTemplate) {
  return async(data) => {
    /* eslint-disable no-param-reassign */
    try {
      let buffer = ''
      await compiledFuncTemplate(data, {
        async callback(item) {
          const value = await processResult(item, env.stream)
          if (!env.stream && value) {
            buffer += value
          }
          return buffer
        }
      })
      return buffer
    } catch (e) {
      if (env.stream) {
        env.stream.emit('error', e)
      }
      return false
    }
  }
}
// For compatibility and usage outside of module systems, make the Handlebars object a namespace
function create() {
  const hb = new base.HandlebarsEnvironment()

  Utils.extend(hb, base)
  hb.SafeString = SafeString
  hb.Exception = Exception
  hb.Utils = Utils
  hb.escapeExpression = Utils.escapeExpression

  hb.VM = runtime
  hb.template = spec => wrapTemplate(hb, runtime.template(spec, hb))

  return hb
}

// eslint-disable-next-line one-var
const inst = create()
inst.create = create

noConflict(inst)

inst.default = inst

module.exports = inst
