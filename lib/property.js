
const typeforce = require('typeforce')
const {
  assert,
  updateErrorWithMessage,
  parseId,
  isInlinedProperty,
  getRef,
  getProperty
} = require('./utils')

const ObjectModel = require('./object-model')
const typeValidators = {
  date: validateDatePropertyValue,
  bytes: enforceType('Buffer'),
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
  const prop = getProperty({ model, propertyName })
  try {
    typeValidators[prop.type](opts)
  } catch (err) {
    throw updateErrorWithMessage(err, `invalid property ${propertyName}: ${err.message}`)
  }
}

function validateProperty ({ models, model, propertyName, value }) {
  validateType({ models, model, propertyName, value })
}

function validateObjectPropertyValue ({ models, model, propertyName, value }) {
  const property = getProperty({ model, propertyName })
  const ref = getRef(property)
  const range = models[ref]
  if (range && range.subClassOf === 'tradle.Enum' && range.enum) {
    typeforce('String', value)
    const prefix = range.id + '_'
    if (!value.startsWith(prefix)) {
      throw new Error(`expected value to start with "${prefix}"`)
    }

    return
  } else {
    typeforce('Object', value)
  }

  if (isInlinedProperty({ models, property })) return

  typeforce({
    id: 'String',
    title: '?String'
  }, value)

  validateId(value.id)
}

function validateArrayPropertyValue ({ models, model, propertyName, value }) {
  typeforce(typeforce.arrayOf('Object'), value)
  value.forEach(item => {
    validateObjectPropertyValue({ models, model, propertyName, value: item })
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
  // if (link && link.length !== 64) {
  //   throw new Error('object links must be 32 bytes long')
  // }
}
