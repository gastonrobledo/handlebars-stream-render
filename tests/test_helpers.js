const { Transform } = require('stream'),
      { assert } = require('chai'),
      handlebars = require('../index')

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
// eslint-disable-next-line one-var
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
            content: '<html><body><h1>Layout</h1><div>{{#block "body_replace"}}<i>Text before</i>{{/block}}</div><div>{{#block "body_append"}}<i>Text before content</i>{{/block}}</div><div>{{#block "body_prepend"}}<i>Text after content</i>{{/block}}</div></body></html>'
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

    hbs.compile('{{#extend "layout"}}{{#prepend "body_prepend"}}{{#each (cursor)}}{{#if @first}}<span>test first</span>{{/if}}<div><h2>{{name}}</h2><p>{{#delay}}{{/delay}}</p></div>{{/each}}{{/prepend}}{{#append "body_append"}}{{#each (cursor)}}<div><a>{{name}}</a><p>{{#delay}}{{/delay}}</p></div>{{/each}}{{/append}}{{#replace "body_replace"}}<ul>{{#each (cursor)}}<li>{{name}} - {{#delay}}{{/delay}}</li>{{/each}}</ul>{{/replace}}{{/extend}}', {})

    const expected = '<html><body><h1>Layout</h1><div><ul><li>test - 1000</li><li>test2 - 1000</li></ul></div><div><i>Text before content</i><div><a>test</a><p>1000</p></div><div><a>test2</a><p>1000</p></div></div><div><span>test first</span><div><h2>test</h2><p>1000</p></div><div><h2>test2</h2><p>1000</p></div><i>Text after content</i></div></body></html>'
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

  it('test with partials', (done) => {
    const partials = [
            {
              name: 'c_table_headers_temp', content: `<tr>
    <th>ID</th>
    <th>Name</th>
    <th>Age</th>
    <th>Height</th>
    <th>Weight</th>
    <th>Heart Rate</th>
    <th>Blood Pressure</th>
    <th>Body Fat Percentage</th>
    <th>Body Mass Index</th>
    <th>Waist Circumference</th>
    <th>Does Exercise</th>
    <th>Exercise hours per week</th>
</tr>`
            },
            {
              name: 'c_table_content_temp', content: `<tr>
    <td>{{c_id}}</td>
    <td>{{c_name}}</td>
    <td>{{c_age}}</td>
    <td>{{c_height}}</td>
    <td>{{c_weight}}</td>
    <td>{{c_heart_rate}}</td>
    <td>{{c_blood_pressure}}</td>
    <td>{{c_body_fat_percentage}}</td>
    <td>{{c_body_mass_index}}</td>
    <td>{{c_waist_circumference}}</td>
    {{#if c_does_exercise}}
        <td>YES</td>
        <td>{{c_exercise_hours}}</td>
    {{else}}
        <td>NOPE</td>
        <td>NONE</td>
    {{/if}}
</tr>`
            }
          ],
          hbs = new HandlebarsStream(partials),
          expected = `<!DOCTYPE html>
<html dir="ltr" lang="en-US">
<head>
    <title>Patient Summary</title>
    <style>
        h1 {
            color: blue;
            text-align: center;
            display: block;
            font-size: 2em;
            margin: 0.67em 0.4em;
            font-weight: bold;
        }
        p {
            color: #4d4d4d;
            text-align: justify;
        }
        table {
            border-spacing: 0;
            border-top: 2px solid black;
            border-right: 2px solid black;
            font-size: smaller;
            text-align: center;
        }
        td {
            border-bottom: 2px solid black;
            border-left: 2px solid black;
        }
        th {
            border-bottom: 2px solid black;
            border-left: 2px solid black;
        }
    </style>
</head>
<body>
    <h1>Patients</h1>
    <p>A summary of patient information</p>
    <br>
    <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </p>
    <table>
<tr>
    <th>ID</th>
    <th>Name</th>
    <th>Age</th>
    <th>Height</th>
    <th>Weight</th>
    <th>Heart Rate</th>
    <th>Blood Pressure</th>
    <th>Body Fat Percentage</th>
    <th>Body Mass Index</th>
    <th>Waist Circumference</th>
    <th>Does Exercise</th>
    <th>Exercise hours per week</th>
</tr><tr>
    <td></td>
    <td>Gaston</td>
    <td>37</td>
    <td>14</td>
    <td>100</td>
    <td>120</td>
    <td></td>
    <td>1</td>
    <td>1</td>
    <td>60</td>
        <td>YES</td>
        <td>8</td>
</tr><tr>
    <td></td>
    <td>Lisandro</td>
    <td>37</td>
    <td>14</td>
    <td>100</td>
    <td>120</td>
    <td></td>
    <td>1</td>
    <td>1</td>
    <td>60</td>
        <td>YES</td>
        <td>8</td>
</tr>    </table>
</body>
</html>`
    hbs.registerHelper('cursor', async() => Promise.resolve([
      {
        c_name: 'Gaston',
        c_age: 37,
        c_height: 14,
        c_weight: 100,
        c_heart_rate: 120,
        c_blod_pressure: 1,
        c_body_fat_percentage: 1,
        c_body_mass_index: 1,
        c_waist_circumference: 60,
        c_does_exercise: true,
        c_exercise_hours: 8
      },
      {
        c_name: 'Lisandro',
        c_age: 37,
        c_height: 14,
        c_weight: 100,
        c_heart_rate: 120,
        c_blod_pressure: 1,
        c_body_fat_percentage: 1,
        c_body_mass_index: 1,
        c_waist_circumference: 60,
        c_does_exercise: true,
        c_exercise_hours: 8
      },
    ]))
    hbs.compile(`<!DOCTYPE html>
<html dir="ltr" lang="en-US">
<head>
    <title>Patient Summary</title>
    <style>
        h1 {
            color: blue;
            text-align: center;
            display: block;
            font-size: 2em;
            margin: 0.67em 0.4em;
            font-weight: bold;
        }
        p {
            color: #4d4d4d;
            text-align: justify;
        }
        table {
            border-spacing: 0;
            border-top: 2px solid black;
            border-right: 2px solid black;
            font-size: smaller;
            text-align: center;
        }
        td {
            border-bottom: 2px solid black;
            border-left: 2px solid black;
        }
        th {
            border-bottom: 2px solid black;
            border-left: 2px solid black;
        }
    </style>
</head>
<body>
    <h1>Patients</h1>
    <p>A summary of patient information</p>
    <br>
    <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </p>
    <table>
        {{> c_table_headers_temp}}
        {{#each (cursor patients)}}
            {{> c_table_content_temp}}
        {{/each}}
    </table>
</body>
</html>`, { patients: [] })
    let result = ''
    hbs.on('data', (block) => {
      result += block.toString()
    }).on('end', () => {
      assert(result.trim() === expected.trim())
      done()
    })
  })

  it('test with blocks inside iterators helper', (done) => {
    const hbs = new HandlebarsStream([{
            name: 'test',
            content: '{{#each names}}<i>{{#block "name"}}{{/block}}{{name}}</i>{{/each}}'
          }]),
          expected = '<i>Nombre:gaston</i><i>Nombre:pedro</i>',
          stream = new Transform({
            objectMode: true,
            transform(chunk, enc, cb) {
              this.push(chunk)
              cb()
            }
          })
    hbs.compile('{{#extend "test"}}{{#replace "name"}}Nombre:{{/replace}}{{/extend}}', { names: stream })
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

  it('test multiple instances', (done) => {
    const partial = {
            name: 'test',
            content: '<h3>{{name}}</h3>'
          },
          template = `<!DOCTYPE html>
<html dir="ltr" lang="en-US">
<body>
            <div style="width: 100%">
                {{#each names}}
                    {{> test}}
                {{/each}}
            </div>
</div>
</body>
</html>`,
          hbs = new HandlebarsStream([partial]),
          hbs1 = new HandlebarsStream([partial]),
          names = [{
            name: 'Gaston'
          }, {
            name: 'Pedro'
          }]
    hbs.compile(template, { names })
    hbs1.compile(template, { names })
    const promises = []
    promises.push(new Promise((resolve, reject) => {
      let result = ''
      hbs.on('data', (block) => {
        result += block.toString()
      }).once('error', e => reject(e))
        .on('end', () => {
          resolve(result)
        })
    }))
    promises.push(new Promise((resolve, reject) => {
      let result = ''
      hbs1.on('data', (block) => {
        result += block.toString()
      }).once('error', e => reject(e))
        .on('end', () => {
          resolve(result)
        })
    }))

    Promise.all(promises).then((results) => {
      assert(results[0].trim() === results[1].trim(), 'results are not the same')
      done()
    }).catch(e => done(e))
  })

  it('test @first @last on stream', (done) => {
    const hbs = new HandlebarsStream([{
            name: 'test',
            content: '{{#each names}}{{#if @first}}<div>{{/if}}<i>{{name}}</i>{{#if @last}}</div>{{/if}}{{/each}}'
          }]),
          expected = '<div><i>gaston</i><i>pedro</i></div>',
          stream = new Transform({
            objectMode: true,
            transform(chunk, enc, cb) {
              this.push(chunk)
              cb()
            }
          })
    hbs.compile('{{#extend "test"}}{{#replace "name"}}Nombre:{{/replace}}{{/extend}}', { names: stream })
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

  it('test with deep partial template', (done) => {
    const hbs = new HandlebarsStream([{
            name: 'test_deep',
            content: '{{#each names}}<i>{{name}}</i>{{/each}}'
          },
          {
            name: 'test',
            content: '<div>{{> test_deep}}</div>'
          }
          ]),
          expected = 'test <p><div><i>gaston</i><i>pedro</i></div></p> test'
    hbs.compile('test <p>{{> test}}</p> test', { names: [{ name: 'gaston' }, { name: 'pedro' }] })
    let result = ''
    hbs.on('data', (block) => {
      result += block.toString()
    }).on('end', () => {
      assert(result.trim() === expected.trim())
      done()
    })
  })

  it('test without stream', async() => {
    const hbs = handlebars.create(),
          tpl = hbs.compile('{{#each names}}<p>{{name}}</p>{{/each}}'),
          result = await tpl({ names: [{ name: 'gaston' }, { name: 'pedro' }] })
    assert(result, '<p>gaston</p><p>pedro</p>')
  })

  it('test without stream and async helper', async() => {
    const hbs = handlebars.create()
    hbs.registerHelper('delay', delay)

    // eslint-disable-next-line one-var
    const tpl = hbs.compile('Delay {{#delay}}{{/delay}}'),
          result = await tpl()
    assert(result, 'Delay 1000')
  })
})
