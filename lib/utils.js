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
  PREVLINK
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
  getRef
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
