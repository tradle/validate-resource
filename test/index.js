
const test = require('tape')
const mergeModels = require('@tradle/merge-models')
const models = mergeModels()
  .add(require('@tradle/models').models)
  .add(require('@tradle/custom-models'))
  .get()

// const Profile = models['tradle.Profile']
const validate = require('../')
const { utils } = validate
const broken = require('./fixtures/invalid')
const good = require('./fixtures/valid')

test('validate resource', function (t) {
  broken.forEach((item, i) => {
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

  t.same(utils.omitVirtual(obj, ['_ha']), {
    a: 1,
    _hey: 'ho',
    _virtual: ['_hey']
  })

  t.same(utils.pickVirtual(obj), {
    _ha: 'ha',
    _hey: 'ho',
    _virtual: ['_ha', '_hey']
  })

  t.same(utils.pickVirtual(obj, ['_ha']), {
    _ha: 'ha'
  })

  t.end()
})

test('utils', function (t) {
  const model = models['tradle.Sex']
  const eVal = model.enum[0]
  t.same(utils.parseEnumValue({
    model,
    value: `${model.id}_${eVal.id}`
  }), eVal)

  t.same(utils.parseEnumValue({
    model,
    value: {
      id: `${model.id}_${eVal.id}`,
      title: eVal.title
    }
  }), eVal)

  t.same(utils.parseStub({
    id: 'tradle.Profile_abc_123',
    title: 'mamajama'
  }), {
    type: 'tradle.Profile',
    link: '123',
    permalink: 'abc',
    title: 'mamajama'
  })

  t.end()
})
