const typeforce = require('typeforce')
const traverse = require('traverse')
const clone = require('xtend')
// const { resourceStub } = require('./types')
const {
  assert,
  isProtocolProperty,
  omitVirtual
} = require('./utils')

const {
  TYPE,
  SIG,
  PERMALINK,
  PREVLINK
} = require('./constants')

const validateProperty = require('./property')
exports.resource = validateResource
exports.changes = validateChanges

const typeValidators = require('./type')

/**
 * Validate a resource solely based on its model (excluding refs to other models)
 * @param  {Object} options.model
 * @param  {Object} options.resource
 * @return {[type]}                  [description]
 */
function validateResource ({ models, model, resource, inlined, allowUnknown }) {
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

  Object.keys(omitVirtual(resource))
    .forEach(propertyName => {
      if (isProtocolProperty(propertyName)) return

      if (!(propertyName in properties)) {
        return
        // throw new Error(`model "${model.id}" has no property "${propertyName}"`)
      }

      const value = resource[propertyName]
      validateProperty({ models, model, propertyName, value })
    })

  const type = resource[TYPE]
  const validateType = typeValidators[type]
  if (validateType) validateType({ models, model, resource })
}

/**
 * Validate that proposed changes to an existing resource are legal
 * @param  {Object} options.model
 * @param  {Object} options.resource
 * @param  {Object} options.changes
 */
function validateChanges ({ models, model, resource, changes }) {
  const { properties } = model
  for (let propertyName in changes) {
    let prop = properties[propertyName]
    if (prop.immutable) {
      throw new Error(`property "${propertyName}" is immutable`)
    }
  }

  validateResource({
    models,
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
