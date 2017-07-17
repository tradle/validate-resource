const omit = require('object.omit')
const pick = require('object.pick')
const validateModels = require('@tradle/validate-model')
const {
  normalizeError,
  updateErrorWithMessage
  // TODO: export better from @tradle/validate
} = validateModels.utils

const {
  TYPE,
  SIG,
  PERMALINK,
  PREVLINK,
  MESSAGE
} = require('./constants')

module.exports = {
  parseId,
  assert,
  normalizeError,
  updateErrorWithMessage,
  isProtocolProperty,
  isInlinedProperty,
  isEmailProperty,
  toModelsMap,
  getRef,
  omitVirtual,
  pickVirtual,
  setVirtual,
  forEachNonVirtual
}

function parseId (id) {
  const [type, permalink, link] = id.split('_')
  return { type, permalink, link }
}

function assert (statement, err) {
  if (!statement) throw new Error(err || 'assertion failed')
}

function isProtocolProperty (propertyName) {
  return propertyName === SIG ||
    propertyName === TYPE ||
    propertyName === PERMALINK ||
    propertyName === PREVLINK
}

function isInlinedProperty ({ models, property }) {
  const ref = getRef(property)
  if (property.inlined ||
    ref === 'tradle.Money' ||
    ref === 'tradle.Phone' ||
    ref === 'tradle.Photo' ||
    property.range === 'json' ||
    property.items && !property.items.ref) {
    return true
  }

  if (ref) {
    const refModel = models[ref]
    return refModel && refModel.inlined
  }

  return false
}

function isEmailProperty ({ propertyName, property }) {
  // TODO: add email subType
  if (property.type === 'string') {
    return property.keyboard === 'email-address'
  }
}

function getRef (property) {
  return property.ref || (property.items && property.items.ref)
}

function toModelsMap (arr) {
  if (!Array.isArray(arr)) return arr

  const obj = {}
  for (let model of arr) {
    obj[model.id] = model
  }

  return obj
}

function omitVirtual (object) {
  const virtual = (object._virtual || []).concat('_virtual')
  const real = omit(object, virtual)
  if (real[TYPE] === MESSAGE) {
    real.object = omitVirtual(real.object)
  }

  return real
}

function pickVirtual (object) {
  return object._virtual ? pick(object, object._virtual) : {}
}

function setVirtual (object, props) {
  if (!object._virtual) {
    object._virtual = []
  }

  for (let key in props) {
    let val = props[key]
    if (val == null) {
      throw new Error('null and undefined values are not allowed')
    }

    if (object._virtual.indexOf(key) === -1) {
      object._virtual.push(key)
    }

    object[key] = val
  }

  return object
}

function forEachNonVirtual (resource, fn) {
  return Object
    .keys(omitVirtual(resource))
    .forEach(fn)
}
