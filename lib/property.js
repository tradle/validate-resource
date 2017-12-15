const typeforce = require('typeforce')
const {
  assert,
  updateErrorWithMessage,
  parseId,
  isInlinedProperty,
  getProperty,
  getRef,
  isDescendantOf
} = require('./utils')

const typeValidators = {
  date: ({ value }) => assert(typeof value === 'number', 'expected "number"'),
  bytes: ({ value }) => assert(Buffer.isBuffer(value), 'expected Buffer'),
  string: ({ value }) => assert(typeof value === 'string', 'expected "string"'),
  enum: ({ value }) => assert(typeof value === 'string', 'expected "string"'),
  boolean: ({ value }) => assert(typeof value === 'boolean', 'expected "boolean"'),
  number: ({ value }) => assert(typeof value === 'number', 'expected "number"'),
  object: validateObjectPropertyValue,
  array: validateArrayPropertyValue
}

exports = module.exports = validateProperty
exports.property = validateProperty
exports.type = typeValidators
exports.id = validateId
exports.link = validateLink

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
  typeforce('Object', value)

  const property = getProperty({ model, propertyName })
  if (isInlinedProperty({ models, property })) return

  typeforce({
    id: 'String',
    title: '?String'
  }, value)

  const { type } = validateId(value.id)
  const typeModel = models[type]
  const ref = getRef(property)
  const refModel = models[ref]
  if (!refModel.isInterface &&
    ref !== type &&
    !isDescendantOf({ models, a: type, b: ref })) {
    throw new Error(`expected value to be of type or subclass of type "${refModel.id}", got "${type}"`)
  }
}

function validateArrayPropertyValue ({ models, model, propertyName, value }) {
  const property = getProperty({ model, propertyName })
  const ref = getRef(property)
  const { type } = property.items
  if (ref || type === 'object') {
    typeforce(typeforce.arrayOf('Object'), value)
    value.forEach(item => {
      validateObjectPropertyValue({ models, model, propertyName, value: item })
    })
  } else {
    value.forEach(item => {
      typeValidators[type]({ value: item })
    })
  }
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

  return parsed
}

function validateLink (link) {
  typeforce('String', link)
  // if (link && link.length !== 64) {
  //   throw new Error('object links must be 32 bytes long')
  // }
}
