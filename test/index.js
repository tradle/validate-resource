
const test = require('tape')
const models = require('@tradle/models')
// const Profile = models['tradle.Profile']
const validate = require('../').resource
const broken = require('./fixtures/invalid')
const good = require('./fixtures/valid')

test('validate resource', function (t) {
  broken.forEach(item => {
    t.throws(() => validate({
      models,
      resource: item.resource
    }), item.error)
  })

  good.forEach(item => {
    t.doesNotThrow(() => validate({
      models,
      resource: item.resource
    }))
  })

  t.end()
})