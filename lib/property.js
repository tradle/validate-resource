
const typeforce = require('typeforce')
const {
  assert,
  updateErrorWithMessage,
  parseId,
  isInlinedProperty
} = require('./utils')

const typeValidators = {
  date: validateDatePropertyValue,
  string: enforceType('String'),
  enum: enforceType('String'),
  boolean: enforceType('Boolean'),
  number: enforceType('Number'),
  object: validateObjectPropertyValue,
  array: validateArrayPropertyValue
}

exports = module.exports = validateProperty
exports.property = validateProperty
exports.type = typeValidators
exports.id = validateId
exports.link = validateLink

function enforceType (type) {
  return function ({ value }) {
    return typeforce(type, value)
  }
}

function validateDatePropertyValue ({ value }) {
  assert(isDateish(value), 'expected date')
}

function isDateish (value) {
  if (typeof value !== 'string' && typeof value !== 'number') return false

  return !isNaN(new Date(value).getTime())
}

function validateType (opts) {
  const { model, propertyName } = opts
  const prop = model.properties[propertyName]
  try {
    typeValidators[prop.type](opts)
  } catch (err) {
    throw updateErrorWithMessage(err, `invalid property ${propertyName}: ${err.message}`)
  }
}

function validateProperty ({ model, propertyName, value }) {
  validateType({ model, propertyName, value })
}

function validateObjectPropertyValue ({ model, propertyName, value }) {
  typeforce('Object', value)

  const prop = model.properties[propertyName]
  if (isInlinedProperty(prop)) return

  typeforce({
    id: 'String',
    title: '?String'
  }, value)

  validateId(value.id)
}

function validateArrayPropertyValue ({ model, propertyName, value }) {
  typeforce(typeforce.arrayOf('Object'), value)
  value.forEach(item => {
    validateObjectPropertyValue({ model, propertyName, value: item })
  })
}

function validateId (id) {
  typeforce('String', id)

  const parsed = parseId(id)
  typeforce({
    type: 'String',
    permalink: 'String',
    link: '?String'
  }, parsed)

  validateLink(parsed.permalink)
  if (parsed.link) {
    validateLink(parsed.link)
  }
}

function validateLink (link) {
  typeforce('String', link)
  if (link && link.length !== 64) {
    throw new Error('object links must be 32 bytes long')
  }
}
