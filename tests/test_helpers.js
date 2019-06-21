const { Transform } = require('stream'),
      { assert } = require('chai'),
      handlebars = require('../lib')

class HandlebarsStream extends Transform {

  constructor(partials) {
    super()
    this.hbs = handlebars.create()
    if (partials && partials.length) {
      partials.forEach(p => this.hbs.registerPartial(p.name, p.content))
    }
  }

  registerHelper(name, fn) {
    return this.hbs.registerHelper(name, fn)
  }

  compile(content, data) {
    this.result = this.hbs.compile(content)(data, { stream: this })
    return this
  }

  _transform(chunk, enc, cb) {
    this.push(chunk)
    cb()
  }

  _final(cb) {
    cb()
  }

}
const timeout = ms => new Promise(res => setTimeout(res, ms)),
      delay = async function delayFn() {
        await timeout(1000)
        return 1000
      }


describe('Stream Test', () => {


  xit('test simple', (done) => {
    const hbs = new HandlebarsStream()
    hbs.registerHelper('delay', delay)
    hbs.compile('Delay {{#delay}}{{/delay}}', {})

    let result = ''
    hbs.on('data', (content) => {
      result += content.toString()
    }).on('end', () => {
      assert(result.trim() === 'Delay 1000')
      done()
    })

  })

  it('Test stream out with sync helper', (done) => {
    const partials = [{
            name: 'layout',
            content: '<html><body><h1>Layout</h1><div>{{#block "body_replace"}}<i>Text before</i>{{/block}}</div><div>{{#block "body_append"}}<i>Text before appended content</i>{{/block}}</div><div>{{#block "body_prepend"}}<i>Text before appended content</i>{{/block}}</div></body></html>'
          }],
          hbs = new HandlebarsStream(partials)
    hbs.registerHelper('delay', delay)
    hbs.registerHelper('cursor', async(options) => {
      if (options && options.data && options.data.root.discard) {
        return Promise.resolve('')
      }
      await timeout(1000)
      return [{ name: 'test' }, { name: 'test2' }]
    })

    hbs.compile('{{#extend "layout"}}{{#prepend "body_prepend"}}{{#each (cursor)}}<div><h2>{{name}}</h2><p>{{#delay}}{{/delay}}</p></div>{{/each}}{{/prepend}}{{#append "body_append"}}{{#each (cursor)}}<a>{{name}}</a><p>{{#delay}}{{/delay}}</p></div>{{/each}}{{/append}}{{#replace "body_replace"}}<ul>{{#each (cursor)}}<li>{{name}} - {{#delay}}{{/delay}}</li>{{/each}}</ul>{{/replace}}{{/extend}}', {})

    const expected = '<html><body><h1>Layout</h1><div><h2>test</h2><p>1000</p></div><div><h2>test2</h2><p>1000</p></div></body></html>'
    let result = ''
    hbs.on('data', (content) => {
      result += content.toString()
    }).on('end', () => {
      console.log((result.replace('\n', '')).trim(), '\n================\n', (expected.replace('\n', '')).trim())
      assert(result.replace('\n', '').trim() === expected.replace('\n', '').trim())
      done()
    })

  })

})
