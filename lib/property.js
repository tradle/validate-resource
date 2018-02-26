const {
  assertValidValue,
  assertValidPropertyValue,
  updateErrorWithMessage,
  parseId,
  isInlinedProperty,
  getProperty,
  getRef,
  isDescendantOf
} = require('./utils')

const Errors = require('./errors')
const typeValidators = {
  date: ({ propertyName, value }) => {
    assertValidPropertyValue(propertyName, typeof value === 'number', 'expected "number"')
  },
  bytes: ({ propertyName, value }) => {
    assertValidPropertyValue(propertyName, Buffer.isBuffer(value), 'expected Buffer')
  },
  string: ({ propertyName, value }) => {
    assertValidPropertyValue(propertyName, typeof value === 'string', 'expected "string"')
  },
  enum: ({ propertyName, value }) => {
    assertValidPropertyValue(propertyName, typeof value === 'string', 'expected "string"')
  },
  boolean: ({ propertyName, value }) => {
    assertValidPropertyValue(propertyName, typeof value === 'boolean', 'expected "boolean"')
  },
  number: ({ propertyName, value }) => {
    assertValidPropertyValue(propertyName, typeof value === 'number', 'expected "number"')
  },
  object: validateObjectPropertyValue,
  array: validateArrayPropertyValue
}

exports = module.exports = validateProperty
exports.property = validateProperty
exports.type = typeValidators
exports.id = validateId
exports.link = validateLink

function assertArrayOfObjects (propertyName, value) {
  if (!(Array.isArray(value) && value.every(item => item && typeof item === 'object'))) {
    throw new Errors.InvalidPropertyValue('expected array of objects')
  }
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
  if (!(value && typeof value === 'object')) {
    throw new Errors.InvalidPropertyValue(propertyName, 'expected "object"')
  }

  const property = getProperty({ model, propertyName })
  if (isInlinedProperty({ models, property })) return

  let parsed
  try {
    parsed = validateId(value.id)
  } catch (err) {
    throw new Errors.InvalidPropertyValue(propertyName, err.message)
  }

  const { type } = parsed
  if (value.title && typeof value.title !== 'string') {
    throw new Errors.InvalidPropertyValue(propertyName, 'expected string "title"')
  }

  // const typeModel = models[type]
  const ref = getRef(property)
  const refModel = models[ref]
  if (!refModel.isInterface &&
    ref !== type &&
    !isDescendantOf({ models, a: type, b: ref })) {
    throw new Errors.InvalidPropertyValue(`expected value to be of type or subclass of type "${refModel.id}", got "${type}"`)
  }
}

function validateArrayPropertyValue ({ models, model, propertyName, value }) {
  const property = getProperty({ model, propertyName })
  const ref = getRef(property)
  const spec = property.items
  const { type } = spec
  if (ref || type === 'object') {
    assertArrayOfObjects(propertyName, value)
    value.forEach(item => {
      validateObjectPropertyValue({ models, model, propertyName, value: item })
    })
  } else if (spec.properties) {
    value.forEach(item => {
      const nestedType = spec.type || 'object'
      typeValidators[nestedType]({ models, model, propertyName, value: item })
    })
  }
}

function validateId (id) {
  assertValidValue(typeof id === 'string', 'expected string "id"')
  const parsed = parseId(id)
  assertValidValue(typeof parsed.type === 'string', 'invalid id')
  validateLink(parsed.permalink)
  if (parsed.link) {
    validateLink(parsed.link)
  }

  return parsed
}

function validateLink (link) {
  assertValidValue(typeof link === 'string', 'expected string "link"')
}
