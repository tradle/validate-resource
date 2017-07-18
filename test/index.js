
const test = require('tape')
const models = require('@tradle/models').models.concat(require('@tradle/custom-models'))
// const Profile = models['tradle.Profile']
const validate = require('../')
const { utils } = validate
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

test('virtual properties', function (t) {
  const obj = {
    a: 1
  }

  utils.setVirtual(obj, { _ha: 'ha' })
  t.same(obj, {
    a: 1,
    _ha: 'ha',
    _virtual: ['_ha']
  })

  utils.setVirtual(obj, { _hey: 'ho' })
  t.same(obj, {
    a: 1,
    _ha: 'ha',
    _hey: 'ho',
    _virtual: ['_ha', '_hey']
  })

  t.same(utils.omitVirtual(obj), {
    a: 1
  })

  t.same(utils.pickVirtual(obj), {
    _ha: 'ha',
    _hey: 'ho',
    _virtual: ['_ha', '_hey']
  })

  t.end()
})
