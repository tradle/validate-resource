const extend = require('lodash/extend')
const validateModels = require('@tradle/validate-model')
const {
  TYPE,
  TYPES: {
    MODEL
  }
} = require('@tradle/constants')

const {
  getRef,
  parseId,
  isInlinedProperty,
  forEachNonVirtual,
  getProperty,
  isInstantiable,
  isEnum,
  isSubClassOf
} = require('./utils')

const Errors = require('./errors')
const defaults = require('./defaults')

const typeValidators = {
  object: validateObjectPropertyValue,
  array: validateArrayPropertyValue
}

exports = module.exports = validateRefs
exports.byType = typeValidators

function validateRefs ({
  models,
  model,
  resource,
  allowUnknown=defaults.allowUnknown
}) {
  forEachNonVirtual(resource, propertyName => {
    const prop = getProperty({ model, propertyName })
    if (!prop) {
      if (!allowUnknown) {
        throw new Errors.NoSuchProperty(`model "${model.id}" has no property "${propertyName}"`)
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
      return require('./resource').resource({
        models,
        model: {
          properties
        },
        inlined: true,
        resource: value
      })
    }

    const inlinedType = property.items && property.items.type
    if (inlinedType && inlinedType !== 'object' && inlinedType !== 'array') {
      return
    }

    if (ref === MODEL) {
      return validateModels.model(value)
    }

    checkValidRef({ models, ref })
    const refModel = models[ref]
    const valType = value[TYPE]
    const valModel = valType ? models[valType] : refModel
    if (valType) {
      checkValidRef({ models, ref: valType })
    }

    if (ref !== 'tradle.Object'                     &&
      valModel.id !== refModel.id                   &&
      !isSubClassOf({ model: valModel, subModel: refModel, models }) &&
      // valModel.subClassOf !== refModel.id &&
      !(refModel.isInterface && valModel.interfaces.indexOf(refModel.id) !== -1)) {
      throw new Errors.InvalidPropertyValue(propertyName, `expected "${refModel.id}", got "${valType}"`)
    }

    const opts = {
      models,
      model: valModel,
      // inlined resources might not have [TYPE] prop
      resource: extend({
        [TYPE]: valType || ref
      }, value),
      partial: property.partial
    }

    return require('./resource').resource(opts)
    // return validateRefs(opts)
  }

  // debug(`TODO: validate array property ${propertyName} of ${model.id}`)
  // validateObjectPropertyValue({
  //   models,
  //   model,
  //   propertyName,
  //   value: item
  // })

  if (!ref) return

  const refModel = models[ref]
  let type
  if (isEnum(refModel)) {
    type = ref
  } else {
    type =  value[TYPE]
  }

  const valueModel = models[type]
  if (!valueModel) {
    throw new Errors.NoSuchModel(`"${propertyName}" references non-existent model ${type}`)
  }

  if (!(isEnum(valueModel) || isInstantiable(valueModel))) {
    throw new Errors.NotInstantiable(`${valueModel.id} is not instantiable`)
  }
}

function checkValidRef ({ models, ref }) {
  if (ref === MODEL) return true

  const model = models[ref]
  if (!model) {
    throw new Errors.NoSuchModel(`model "${ref}" was not found`)
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
