const { TYPE } = require('@tradle/constants')
const { StubModel } = require('@tradle/validate-model')
const {
  assertValidValue,
  assertValidPropertyValue,
  updateErrorWithMessage,
  parseId,
  isInlinedProperty,
  isEmailProperty,
  validateEmail,
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
  string: ({ model, propertyName, value }) => {
    assertValidPropertyValue(propertyName, typeof value === 'string', 'expected "string"')
    if (isEmailProperty({model, propertyName}))
      validateEmail({model, propertyName, value})
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
    debugger
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

function validateStub ({ models, model, propertyName, value }) {
  const validateResource = require('../').resource
  validateResource({ models, model: StubModel, resource: value })
}

function validateObjectPropertyValue ({ models, model, propertyName, value }) {
  if (!(value && typeof value === 'object')) {
    throw new Errors.InvalidPropertyValue(propertyName, 'expected "object"')
  }

  const property = getProperty({ model, propertyName })
  if (isInlinedProperty({ models, property })) return

  // const typeModel = models[type]
  const ref = getRef(property)
  const refModel = models[ref]
  let type
  if (refModel.subClassOf === 'tradle.Enum') {
    type = ref
  } else {
    validateStub({ models, model, propertyName, value })
    type = value[TYPE]
  }

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
