const { Transform, Writable } = require('stream'),
      { assert } = require('chai'),
      handlebars = require('../index')

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


describe('Test stream results', () => {


  it('Test stream out with sync helper', (done) => {
    const hbs = new HandlebarsStream(),
          expected = `<div class="names">
        <ul>
            <li>John, Q</li>
            <li>John, McKlein</li>
            <li>Susan, Morrison</li>
            <li>Mick, Jagger</li>
        </ul>
      </div>`
    hbs.compile(`
      <div class="names">
        <ul>
            {{#each person}}
            <li>{{firstName}}, {{lastName}}</li>
            {{/each}}    
        </ul>
      </div>
    `, {
      person: [
        { firstName: 'John', lastName: 'Q' },
        { firstName: 'John', lastName: 'McKlein' },
        { firstName: 'Susan', lastName: 'Morrison' },
        { firstName: 'Mick', lastName: 'Jagger' }
      ]
    })
    let result = ''
    hbs.on('data', (block) => {
      result += block.toString()
    }).on('error', (e) => {
      console.log('Error!!!', e)
      done(e)
    }).on('end', () => {
      assert(result.trim() === expected.trim(), 'Templates are not the same')
      done()
    })

  })

  it('Test stream out with async helper', (done) => {
    const hbs = new HandlebarsStream()
    hbs.registerHelper('delay', delay)
    hbs.compile('Delay {{#delay}}{{/delay}}', {})
    let result = ''
    hbs.on('data', (block) => {
      result += block.toString()
    }).on('error', (e) => {
      console.log('Error!!!', e)
      done(e)
    }).on('end', () => {
      assert(result.trim() === 'Delay 1000')
      done()
    })

  })

  it('Test stream  with async/sync helper', (done) => {
    // Register another helper
    const hbs = new HandlebarsStream(),
          template = `<div class="names">
                        <ul>
                            <li>John, Q</li>
                            <li>John, McKlein</li>
                            <li>Susan, Morrison</li>
                            <li>Mick, Jagger</li>
                        </ul>
                      </div>
                      <div>
                        {{#with (ipInfo)}}
                        <p>Country: {{country}}</p>
                        {{/with}}
                      </div>`,
          expected = `<div class="names">
                        <ul>
                            <li>John, Q</li>
                            <li>John, McKlein</li>
                            <li>Susan, Morrison</li>
                            <li>Mick, Jagger</li>
                        </ul>
                      </div>
                      <div>
                        <p>Country: Canada</p>
                      </div>`
    hbs.registerHelper('ipInfo', async() => {
      await timeout(3000)
      return { country: 'Canada' }
    })
    hbs.compile(template, {
      person: [
        { firstName: 'John', lastName: 'Q' },
        { firstName: 'John', lastName: 'McKlein' },
        { firstName: 'Susan', lastName: 'Morrison' },
        { firstName: 'Mick', lastName: 'Jagger' }
      ]
    })
    let result = ''
    hbs.on('data', (block) => {
      result += block.toString()
    }).on('error', (e) => {
      console.log('Error!!!', e)
      done(e)
    }).on('end', () => {
      assert(result.trim() === expected.trim())
      done()
    })

  })

  it('test with partial template', (done) => {
    const hbs = new HandlebarsStream([{
            name: 'test',
            content: '{{#each names}}<i>{{name}}</i>{{/each}}'
          }]),
          expected = 'test <p><i>gaston</i><i>pedro</i></p> test'
    hbs.compile('test <p>{{> test}}</p> test', { names: [{ name: 'gaston' }, { name: 'pedro' }] })
    let result = ''
    hbs.on('data', (block) => {
      result += block.toString()
    }).on('end', () => {
      assert(result.trim() === expected.trim())
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

    const expected = '<html><body><h1>Layout</h1><div><ul><li>test - 1000</li><li>test2 - 1000</li></ul></div><div><i>Text before appended content</i><a>test</a><p>1000</p></div><a>test2</a><p>1000</p></div></div><div><div><h2>test</h2><p>1000</p></div><div><h2>test2</h2><p>1000</p></div><i>Text before appended content</i></div></body></html>'
    let result = ''
    hbs.on('data', (content) => {
      result += content.toString()
    }).on('end', () => {
      assert(result.replace('\n', '').trim() === expected.replace('\n', '').trim())
      done()
    })

  })

  it('test with stream helper', (done) => {
    const hbs = new HandlebarsStream([{
            name: 'test',
            content: '{{#each names}}<i>{{name}}</i>{{/each}}'
          }]),
          expected = 'test <p><i>gaston</i><i>pedro</i></p> test',
          stream = new Transform({
            objectMode: true,
            transform(chunk, enc, cb) {
              this.push(chunk)
              cb()
            }
          })
    hbs.compile('test <p>{{> test}}</p> test', { names: stream })
    let result = ''
    hbs.on('data', (block) => {
      result += block.toString()
    }).on('end', () => {
      assert(result.trim() === expected.trim())
      done()
    })

    stream.write({ name: 'gaston' })
    stream.write({ name: 'pedro' })
    stream.end()
  })

})
