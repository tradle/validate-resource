
const {
  normalizeError,
  updateErrorWithMessage
  // TODO: export better from @tradle/validate
} = require('@tradle/validate/lib/utils')

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
  isInlinedProperty
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

function isInlinedProperty (prop) {
  return prop.inlined ||
    prop.ref === 'tradle.Money' ||
    prop.ref === 'tradle.Phone' ||
    prop.ref === 'tradle.Photo'
}
