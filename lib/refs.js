// const typeforce = require('typeforce')

const {
  parseId,
  isProtocolProperty,
  isInlinedProperty
} = require('./utils')

const {
  TYPE
} = require('./constants')

const typeValidators = {
  object: validateObjectPropertyValue,
  array: validateArrayPropertyValue
}

exports = module.exports = validateResource
exports.byType = typeValidators

function validateResource ({ models, model, resource, inlined=true }) {
  const { properties } = model
  for (let propertyName in resource) {
    if (isProtocolProperty(propertyName)) {
      continue
    }

    let value = resource[propertyName]
    let prop = properties[propertyName]
    let validate = typeValidators[prop.type]
    if (inlined) {
      console.warn('TODO: validate inlined')
    }

    if (validate) {
      validate({ models, model, propertyName, value })
    }
  }
}

function validateObjectPropertyValue ({ models, model, property, propertyName, value }) {
  if (!property) {
    property = model.properties[propertyName]
  }

  const ref = property.ref || property.items.ref
  if (isInlinedProperty({ models, property })) {
    const refModel = models[ref]
    if (!refModel) {
      throw new Error(`model "${ref}" was not found`)
    }

    const valType = value[TYPE]
    const valModel = valType ? models[valType] : refModel
    if (!valModel) {
      throw new Error(`model "${valType}" was not found`)
    }

    if (valModel.id !== refModel.id &&
      valModel.subClassOf !== refModel.id &&
      !(refModel.isInterface && valModel.interfaces.indexOf(refModel.id) !== -1)) {
      throw new Error(`expected "${propertyName}" to hold "${refModel.id}"`)
    }

    return validateResource({
      inlined: true,
      models,
      model: models[ref],
      resource: value
    })
  }

  // console.warn(`TODO: validate array property ${propertyName} of ${model.id}`)
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

  if (valueModel.isInterface || valueModel.abstract) {
    throw new Error(`${valueModel.id} is not instantiable`)
  }
}

function validateArrayPropertyValue ({ models, model, propertyName, value }) {
  const property = model.properties[propertyName]
  value.forEach(value => validateObjectPropertyValue({
    models,
    model,
    property,
    propertyName,
    value
  }))
}
