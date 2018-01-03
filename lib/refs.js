// const typeforce = require('typeforce')
const _ = require('lodash')
const validateModels = require('@tradle/validate-model')
const {
  TYPE
} = require('@tradle/constants')

const {
  debug,
  getRef,
  parseId,
  isProtocolProperty,
  isInlinedProperty,
  forEachNonVirtual,
  getProperty,
  isInstantiable,
  isEnum
} = require('./utils')

const defaults = require('./defaults')

const typeValidators = {
  object: validateObjectPropertyValue,
  array: validateArrayPropertyValue
}

exports = module.exports = validateResource
exports.byType = typeValidators

function validateResource ({
  models,
  model,
  resource,
  allowUnknown=defaults.allowUnknown
}) {
  const { properties } = model
  forEachNonVirtual(resource, propertyName => {
    const prop = getProperty({ model, propertyName })
    if (!prop) {
      if (!allowUnknown) {
        throw new Error(`model "${model.id}" has no property "${propertyName}"`)
      }

      return
    }

    const validate = typeValidators[prop.type]
    if (validate) {
      const value = resource[propertyName]
      validate({ models, model, propertyName, value })
    }
  })
}

function validateObjectPropertyValue ({ models, model, property, propertyName, value }) {
  if (!property) {
    property = getProperty({ model, propertyName })
  }

  if (property.range === 'json') {
    return
  }

  const ref = getRef(property)
  if (isInlinedProperty({ models, property })) {
    const properties = property.properties ||
      (property.items && property.items.properties)

    if (properties) {
      return validateResource({
        models,
        model: {
          properties
        },
        resource: value
      })
    }

    const inlinedType = property.items && property.items.type
    if (inlinedType && inlinedType !== 'object' && inlinedType !== 'array') {
      return
    }

    if (ref === 'tradle.Model') {
      return validateModels.model(value)
    }

    checkValidRef({ models, ref })
    const refModel = models[ref]
    const valType = value[TYPE]
    const valModel = valType ? models[valType] : refModel
    if (valType) {
      checkValidRef({ models, ref: valType })
    }

    if (ref !== 'tradle.Object' &&
      valModel.id !== refModel.id &&
      valModel.subClassOf !== refModel.id &&
      !(refModel.isInterface && valModel.interfaces.indexOf(refModel.id) !== -1)) {
      throw new Error(`expected "${propertyName}" to hold "${refModel.id}", got "${valType}"`)
    }

    const opts = {
      models,
      model: valModel,
      // inlined resources might not have [TYPE] prop
      resource: _.extend({
        [TYPE]: valType || ref
      }, value)
    }

    require('../').resource(opts)
    return validateResource(opts)
  }

  // debug(`TODO: validate array property ${propertyName} of ${model.id}`)
  // validateObjectPropertyValue({
  //   models,
  //   model,
  //   propertyName,
  //   value: item
  // })

  if (!ref) return

  const { id } = value
  const { type } = parseId(id)
  const valueModel = models[type]
  if (!valueModel) {
    throw new Error(`"${propertyName}" references non-existent model ${type}`)
  }

  if (!(isEnum(valueModel) || isInstantiable(valueModel))) {
    throw new Error(`${valueModel.id} is not instantiable`)
  }
}

function checkValidRef ({ models, ref }) {
  if (ref === 'tradle.Model') return true

  const model = models[ref]
  if (!model) {
    throw new Error(`model "${ref}" was not found`)
  }
}

function validateArrayPropertyValue ({ models, model, propertyName, value }) {
  const property = getProperty({ model, propertyName })
  value.forEach(value => validateObjectPropertyValue({
    models,
    model,
    property,
    propertyName,
    value
  }))
}
