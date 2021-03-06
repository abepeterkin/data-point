/* eslint-env jest */

jest.mock('ioredis', () => {
  return require('ioredis-mock')
})

const Factory = require('./factory')
const Express = require('express')
const request = require('supertest')

const logger = require('./logger')
logger.clear()

describe('create - all middleware', () => {
  let service
  beforeAll(() => {
    const options = {
      entities: {
        'transform:hello': (value, acc) => ({
          message: `Hello ${acc.locals.params.name}`
        })
      }
    }
    return Factory.create(options).then(dpService => {
      service = dpService
    })
  })

  test('create inspect service', done => {
    const app = new Express()
    app.use('/inspect', service.inspector())
    request(app)
      .get('/inspect')
      .expect('Content-Type', /html/)
      .expect(response => {
        expect(response.text).toContain('inspect')
      })
      .expect(200)
      .end(done)
  })

  test('create middleware', done => {
    const app = new Express()
    app.get('/hello/:name', service.mapTo('transform:hello'))
    request(app)
      .get('/hello/darek')
      .expect('Content-Type', /json/)
      .expect(response => {
        expect(response.body).toEqual({
          message: 'Hello darek'
        })
      })
      .expect(200)
      .end(done)
  })

  test('it should create router', done => {
    const app = new Express()
    app.use(
      '/api/',
      service.router({
        helloWorld: {
          path: '/hello/:name',
          middleware: 'transform:hello'
        }
      })
    )
    request(app)
      .get('/api/hello/darek')
      .expect('Content-Type', /json/)
      .expect(response => {
        expect(response.body).toEqual({
          message: 'Hello darek'
        })
      })
      .expect(200)
      .end(done)
  })
})
