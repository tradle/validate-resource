
const test = require('tape')
const _ = require('lodash')
const { TYPE, SIG } = require('@tradle/constants')
const mergeModels = require('@tradle/merge-models')
const Errors = require('@tradle/errors')
const models = mergeModels()
  .add(require('@tradle/models').models)
  .add(require('@tradle/custom-models').models)
  .get()

// const Profile = models['tradle.Profile']
const validate = require('../')
const { utils } = validate
const broken = require('./fixtures/invalid')
const good = require('./fixtures/valid')

test('validate resource', function (t) {
  broken.forEach(opts => {
    if (opts.model) models[opts.model.id] = opts.model

    const { error } = opts
    opts = _.extend({ models }, _.omit(opts, 'error'))
    try {
      validate(opts)
      t.fail(`expected error: ${JSON.stringify(error)}`)
    } catch (err) {
      console.log(err.message)
      t.ok(err.name in validate.Errors)
      t.ok(Errors.matches(err, error))
    }
  })

  good.forEach(opts => {
    if (opts.model) models[opts.model.id] = opts.model

    opts = _.extend({ models }, opts)
    t.doesNotThrow(() => validate(opts))
  })

  t.end()
})

test('virtual properties', function (t) {
  const obj = {
    [SIG]: 'somesig',
    a: 1
  }

  utils.setVirtual(obj, { _ha: 'ha' })
  t.same(obj, {
    [SIG]: 'somesig',
    a: 1,
    _ha: 'ha',
    // _virtual: ['_ha']
  })

  utils.setVirtual(obj, { _hey: 'ho' })
  t.same(obj, {
    [SIG]: 'somesig',
    a: 1,
    _ha: 'ha',
    _hey: 'ho',
    // _virtual: ['_ha', '_hey']
  })

  t.same(utils.omitVirtual(obj), {
    [SIG]: 'somesig',
    a: 1
  })

  t.same(utils.omitVirtual(obj, ['_ha']), {
    [SIG]: 'somesig',
    a: 1,
    _hey: 'ho',
  })

  t.same(utils.pickVirtual(obj), {
    _ha: 'ha',
    _hey: 'ho',
    // _virtual: ['_ha', '_hey']
  })

  t.same(utils.pickVirtual(obj, ['_ha']), {
    _ha: 'ha'
  })

  t.equal(utils.hasVirtualDeep({
    models,
    resource: obj
  }), true)

  t.equal(utils.hasVirtualDeep({
    models,
    resource: utils.omitVirtualDeep({
      models,
      resource: obj
    })
  }), false)

  t.same(utils.omitVirtualDeep({
    models,
    resource: obj
  }), {
    [SIG]: 'somesig',
    a: 1
  })

  const noVirt = {
    [TYPE]: 'tradle.FormRequest',
    form: 'tradle.ProductRequest',
    chooser: {
      oneOf: ['a', 'b', 'c']
    }
  }

  const hasVirt = {
    [TYPE]: 'tradle.FormRequest',
    form: 'tradle.ProductRequest',
    chooser: {
      oneOf: ['a', 'b', 'c']
    }
  }

  t.same(utils.omitVirtualDeep({
    models,
    resource: hasVirt
  }), noVirt)

  t.same(utils.omitVirtualDeep1(hasVirt), noVirt)
  t.same(utils.omitVirtualDeep1({
    _link: 'abc',
    blah: {
      _link: 'abc',
      _googa: 123
    }
  }), {
    blah: {
      _link: 'abc'
    }
  })

  utils.stripVirtual(obj)
  t.same(obj, {
    [SIG]: 'somesig',
    a: 1
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

test('allow unknown properties', function (t) {
  const model = {
    type: 'tradle.Model',
    id: 'dynamicModel',
    title: 'Dynamic Model',
    properties: {}
  }

  t.doesNotThrow(() => validate({
    model,
    resource: {
      [TYPE]: model.id
    }
  }))

  t.doesNotThrow(() => validate({
    model,
    resource: {
      [TYPE]: model.id,
      hey: 'ho'
    }
  }))

  t.throws(() => validate({
    model,
    resource: {
      [TYPE]: model.id,
      hey: 'ho'
    },
    allowUnknown: false
  }), /hey/)

  t.throws(() => validate.refs({
    models,
    model,
    resource: {
      [TYPE]: model.id,
      hey: 'ho'
    },
    allowUnknown: false
  }), /hey/)

  t.end()
})

test('sanitize', function (t) {
  const bad = {
    a: undefined,
    b: {
      c: '',
      d: [{
        e: undefined,
        f: '',
        g: 1
      }],
      e: 2
    }
  }

  const copy = _.cloneDeep(bad)
  t.same(utils.sanitize(bad), {
    sanitized: {
      b: {
        d: [{
          g: 1
        }],
        e: 2
      }
    },
    removed: [
      {
        key: 'a',
        value: undefined,
        path: 'a'
      },
      {
        key: 'c',
        value: '',
        path: 'b.c'
      },
      {
        key: 'e',
        value: undefined,
        path: 'b.d.0.e'
      },
      {
        key: 'f',
        value: '',
        path: 'b.d.0.f'
      }
    ]
  })

  // bad is unchanged
  t.same(bad, copy)
  t.end()
})

test('primary keys', function (t) {
  t.same(utils.getPrimaryKeyProperties({
    primaryKeys: {
      hashKey: 'a'
    }
  }), ['a'])

  t.same(utils.getPrimaryKeyProperties({
    primaryKeys: {
      hashKey: 'a',
      rangeKey: 'b',
      blah: 'c'
    }
  }), ['a', 'b'])

  t.same(utils.getPrimaryKeyProperties({}), ['_permalink'])

  t.same(utils.getPrimaryKeys({
    model: {
      primaryKeys: {
        hashKey: 'a'
      }
    },
    resource: {
      a: 1,
      b: 2,
      c: 3,
    }
  }), { a: 1 })

  t.same(utils.getPrimaryKeys({
    model: {
      primaryKeys: {
        hashKey: 'a',
        rangeKey: 'b',
        blah: 'c'
      }
    },
    resource: {
      a: 1,
      b: 2,
      c: 3,
    }
  }), { a: 1, b: 2 })

  t.same(utils.getPrimaryKeys({
    model: {},
    resource: {
      _permalink: 'a',
      a: 1,
      b: 2,
      c: 3,
    }
  }), { _permalink: 'a' })

  t.end()
})
