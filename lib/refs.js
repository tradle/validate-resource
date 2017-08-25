// const typeforce = require('typeforce')
const omit = require('object.omit')
const validateModels = require('@tradle/validate-model')
const {
  debug,
  getRef,
  parseId,
  isProtocolProperty,
  isInlinedProperty,
  forEachNonVirtual,
  getProperty,
  isInstantiable
} = require('./utils')

const {
  TYPE
} = require('@tradle/constants')

const typeValidators = {
  object: validateObjectPropertyValue,
  array: validateArrayPropertyValue
}

exports = module.exports = validateResource
exports.byType = typeValidators

function validateResource ({ models, model, resource, inlined=true }) {
  const { properties } = model
  forEachNonVirtual(resource, propertyName => {
    const prop = getProperty({ model, propertyName })
    if (!prop) {
      // allow unknown props
      return
    }

    let value = resource[propertyName]
    let validate = typeValidators[prop.type]
    if (inlined) {
      debug('TODO: validate inlined')
    }

    if (validate) {
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
  if (ref) {
    const range = models[ref]
    if (range && isWellBehavedEnum(range)) {
      return
    }
  }

  if (isInlinedProperty({ models, property })) {
    const properties = property.properties ||
      (property.items && property.items.properties)

    if (properties) {
      return validateResource({
        inlined: true,
        models,
        model: {
          properties
        },
        resource: value
      })
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
      throw new Error(`expected "${propertyName}" to hold "${refModel.id}"`)
    }

    return validateResource({
      inlined: true,
      models,
      model: valModel,
      resource: value
    })
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

  if (!isInstantiable(valueModel)) {
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

function isWellBehavedEnum (model) {
  return model.subClassOf === 'tradle.Enum' && Array.isArray(model.enum)
}
