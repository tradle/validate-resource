const typeforce = require('typeforce')
const traverse = require('traverse')
const clone = require('xtend')
// const { resourceStub } = require('./types')
const {
  assert,
  isProtocolProperty
} = require('./utils')

const {
  TYPE,
  SIG,
  PERMALINK,
  PREVLINK
} = require('./constants')

const validateProperty = require('./property')
exports.resource = validateAgainstModel
exports.changes = validateChanges

const typeValidators = require('./type')

/**
 * Validate a resource solely based on its model (excluding refs to other models)
 * @param  {Object} options.model
 * @param  {Object} options.resource
 * @return {[type]}                  [description]
 */
function validateAgainstModel ({ model, resource, inlined }) {
  if (hasUndefinedValues(resource)) {
    throw new Error('undefined property values are not allowed')
  }

  if (inlined) {
    typeforce({
      [TYPE]: 'String',
      [SIG]: 'String',
      [PERMALINK]: '?String',
      [PREVLINK]: '?String'
    }, resource)
  } else {
    typeforce({
      [TYPE]: 'String'
    }, resource)
  }

  let {
    properties={},
    required=[]
  } = model

  required.forEach(p => {
    assert(p in resource, `expected required property "${p}"`)
  })

  Object.keys(resource).forEach(propertyName => {
    if (isProtocolProperty(propertyName)) return

    if (!(propertyName in properties)) {
      throw new Error(`model "${model.id}" has no property "${propertyName}"`)
    }

    const value = resource[propertyName]
    validateProperty({ model, propertyName, value })
  })

  const type = resource[TYPE]
  const validateType = typeValidators[type]
  if (validateType) validateType({ model, resource })
}

/**
 * Validate that proposed changes to an existing resource are legal
 * @param  {Object} options.model
 * @param  {Object} options.resource
 * @param  {Object} options.changes
 */
function validateChanges ({ model, resource, changes }) {
  const { properties } = model
  for (let propertyName in changes) {
    let prop = properties[propertyName]
    if (prop.immutable) {
      throw new Error(`property "${propertyName}" is immutable`)
    }
  }

  validateAgainstModel({
    model,
    resource: clone(resource, changes)
  })
}

function hasUndefinedValues (obj) {
  let has
  traverse(obj).forEach(function (val) {
    /* eslint no-undefined: "off" */
    if (val === undefined) {
      has = true
      this.update(undefined, true) // stop traversing
    }
  })

  return has
}
