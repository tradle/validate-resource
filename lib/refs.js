// const typeforce = require('typeforce')

const {
  parseId,
  isProtocolProperty
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

function validateObjectPropertyValue ({ models, model, propertyName, value }) {
  const prop = model.properties[propertyName]
  const ref = prop.ref || prop.items.ref
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
  const prop = model.properties[propertyName]
  value.forEach(item => {
    if (prop.inlined) {
      const ref = prop.ref || prop.items.ref
      const refModel = models[ref]
      if (!refModel) {
        throw new Error(`model "${ref}" was not found`)
      }

      const valType = item[TYPE]
      const valModel = models[valType]
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
        resource: item
      })
    }

    // console.warn(`TODO: validate array property ${propertyName} of ${model.id}`)
    validateObjectPropertyValue({
      models,
      model,
      propertyName,
      value: item
    })
  })
}
