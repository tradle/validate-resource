const extend = require('lodash/extend')
const {
  TYPE,
  SIG,
  PERMALINK,
  PREVLINK
} = require('@tradle/constants')

const { ObjectModel } = require('@tradle/validate-model')

// const { resourceStub } = require('./types')
const {
  assert,
  // isProtocolProperty,
  omitVirtual,
  getProperty,
  getPropertyTitle,
  getInvalidPropertyValue
} = require('./utils')

const validateProperty = require('./property')
const defaults = require('./defaults')
const Errors = require('./errors')

exports.resource = validateResource
exports.changes = validateChanges

const typeValidators = require('./type')

/**
 * Validate a resource solely based on its model (excluding refs to other models)
 * @param  {Object} options.model
 * @param  {Object} options.resource
 * @return {[type]}                  [description]
 */
function validateResource ({
  models,
  model,
  resource,
  inlined,
  allowUnknown=defaults.allowUnknown,
  partial
}) {
  const invalidProperty = getInvalidPropertyValue(resource)
  if (invalidProperty) {
    throw new Errors.InvalidNestedPropertyValue(invalidProperty.path, `value: ${invalidProperty.value}`)
  }

  if (inlined) {
    assert(typeof resource[TYPE] === 'string', `expected string ${TYPE}`)
    assert(typeof resource[SIG] === 'string', `expected string ${SIG}`)
    if (resource[PERMALINK]) {
      assert(typeof resource[PERMALINK] === 'string', `expected string ${PERMALINK}`)
    }
    if (resource[PREVLINK]) {
      assert(typeof resource[PREVLINK] === 'string', `expected string ${PREVLINK}`)
    }
  } else if (model.id) {
    assert(typeof resource[TYPE] === 'string', `expected string ${TYPE}`)
  }

  let {
    properties={},
    required=[]
  } = model

  if (!partial && model.subClassOf !== 'tradle.Enum') {
    const missingRequired = required.filter(propertyName => !(propertyName in resource))
    if (missingRequired.length) {
      throw new Errors.Required(missingRequired)
    }

    Object.keys(omitVirtual(resource))
      .forEach(propertyName => {
        if (propertyName in ObjectModel.properties) return

        if (!(propertyName in properties)) {
          if (!allowUnknown) {
            throw new Errors.NoSuchProperty(`model "${model.id}" has no property "${propertyName}"`)
          }

          return
        }

        const value = resource[propertyName]
        try {
          validateProperty({ models, model, propertyName, value })
        } catch (err) {
          throwPropertyError(propertyName, err.message, err.constructor)
        }
      })
  }

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
    let prop = getProperty({ model, propertyName })
    if (prop.immutable) {
      throwPropertyError(propertyName, `property "${propertyName}" is immutable`, Errors.Immutable)
    }
  }

  validateResource({
    models,
    model,
    resource: extend({}, resource, changes)
  })
}

function throwPropertyError (propertyName, message, ErrorCl=Error) {
  const err = new ErrorCl(message)
  err.property = propertyName
  throw err
}
