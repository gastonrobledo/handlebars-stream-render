# Handlebars Stream Rendering

Plugin to stream out render blocks from handlebars

## Install
```
npm install handlebars-stream-render
```

## Usage
We will use here a stream wrapper in order to simplify explanation
```
class HandlebarsStream extends Transform {

  constructor(partials) {
    super()
    this.hbs = handlebars.create(this)
    if (partials && partials.length) {
      partials.forEach(p => this.hbs.registerPartial(p.name, p.content))
    }
  }

  registerHelper(name, fn) {
    return this.hbs.registerHelper(name, fn)
  }

  compile(content, data) {
    this.result = this.hbs.compile(content)(data)
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
```

### Using with common helpers
```
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

```

### Using with async helpers


```
const timeout = ms => new Promise(res => setTimeout(res, ms))
const hbs = new HandlebarsStream()
    hbs.registerHelper('delay', async function() {
        await timeout(1000)
        return 1000
    })
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

```

#### Using as always but with async support as well


```
 const hbs = handlebars.create(),
          tpl = hbs.compile('{{#each names}}<p>{{name}}</p>{{/each}}'),
          result = await tpl({ names: [{ name: 'gaston' }, { name: 'pedro' }] })
    assert(result, '<p>gaston</p><p>pedro</p>')
   
```

```
const hbs = handlebars.create()
    hbs.registerHelper('delay', delay)

    // eslint-disable-next-line one-var
    const tpl = hbs.compile('Delay {{#delay}}{{/delay}}'),
          result = await tpl()
    assert(result, 'Delay 1000')
```