const _ = require('lodash')
const debug = require('debug')(require('../package.json').name)
const traverse = require('traverse')
const validateModels = require('@tradle/validate-model')
const {
  normalizeError,
  updateErrorWithMessage
  // TODO: export better from @tradle/validate
} = validateModels.utils

const {
  TYPE,
  SIG,
  // PERMALINK,
  // PREVLINK,
  TYPES: {
    MESSAGE
  }
} = require('@tradle/constants')

const Errors = require('./errors')
const ObjectModel = require('./object-model')
const BUILT_IN_VIRTUAL_PROPS = Object.keys(ObjectModel.properties)
  .filter(key => key === '_virtual' || ObjectModel.properties[key].virtual)

module.exports = {
  debug,
  parseId,
  parseStub,
  assert,
  assertValidValue,
  assertValidPropertyValue,
  normalizeError,
  updateErrorWithMessage,
  isProtocolProperty,
  isInlinedProperty,
  isEmailProperty,
  toModelsMap,
  getRef,
  hasVirtualDeep,
  omitVirtualDeep,
  omitVirtual,
  pickVirtual,
  setVirtual,
  stripVirtual,
  forEachNonVirtual,
  getProperty,
  getPropertyTitle,
  parseEnumValue,
  isInstantiable,
  isEnum,
  isDescendantOf,
  getInvalidPropertyValue,
  sanitize
}

function parseId (id) {
  const [type, permalink, link] = id.split('_')
  return { type, permalink, link }
}

function parseStub ({ id, title }) {
  const parsedId = parseId(id)
  parsedId.title = title
  return parsedId
}

function assert (statement, err, ErrorCl=Error) {
  if (!statement) throw new ErrorCl(err || 'assertion failed')
}

function assertValidValue (statement, err) {
  return assert(statement, err, Errors.InvalidValue)
}

function assertValidPropertyValue (property, statement, err) {
  if (!statement) {
    throw new Errors.InvalidPropertyValue(property, err || `invalid value for property ${property}`)
  }
}

function isProtocolProperty (propertyName) {
  const protocolProp = ObjectModel.properties[propertyName]
  return protocolProp && !protocolProp.virtual
  // return propertyName === SIG ||
  //   propertyName === TYPE ||
  //   propertyName === PERMALINK ||
  //   propertyName === PREVLINK
}

function isInlinedProperty ({ models, property }) {
  const ref = getRef(property)
  if (property.inlined ||
    property.properties ||
    ref === 'tradle.Money' ||
    ref === 'tradle.Phone' ||
    ref === 'tradle.Photo' ||
    property.range === 'json' ||
    (property.items && !property.items.ref)) {
    return true
  }

  if (ref) {
    const refModel = models[ref]
    return refModel && refModel.inlined
  }

  return false
}

function isEmailProperty ({ propertyName, property }) {
  // TODO: add email subType
  if (property.type === 'string') {
    return property.keyboard === 'email-address'
  }
}

function getRef (property) {
  return property.ref || (property.items && property.items.ref)
}

function toModelsMap (arr) {
  if (!Array.isArray(arr)) return arr

  const obj = {}
  for (let model of arr) {
    obj[model.id] = model
  }

  return obj
}

function omitVirtual (object, props) {
  if (!props) props = (object._virtual || []).concat('_virtual')

  const real = _.omit(object, props)
  if (real._virtual) {
    real._virtual = real._virtual.filter(prop => {
      return !props.includes(prop)
    })
  }

  if (real[TYPE] === MESSAGE) {
    real.object = omitVirtual(real.object)
  }

  return real
}

function stripVirtual (object) {
  (object._virtual || []).concat('_virtual').forEach(prop => {
    delete object[prop]
  })

  return object
}

function pickVirtual (object, props) {
  if (!props) props = object._virtual.concat('_virtual')

  return object._virtual
    ? _.pick(object, props)
    : {}
}

function setVirtual (object, props) {
  if (!object._virtual) {
    object._virtual = []
  }

  for (let key in props) {
    if (key === '_virtual') continue

    let val = props[key]
    if (val == null) {
      throw new Error(`invalid value ${val} for property: ${key}`)
    }

    if (object._virtual.indexOf(key) === -1) {
      object._virtual.push(key)
    }

    object[key] = val
  }

  return object
}

function forEachNonVirtual (resource, fn) {
  return Object
    .keys(omitVirtual(resource))
    .forEach(fn)
}

function getProperty ({ model, propertyName }) {
  return model.properties[propertyName] || ObjectModel.properties[propertyName]
}

function splitCamelCase (str) {
  return str.split(/(?=[A-Z])/g)
}

function getPropertyTitle ({ model, propertyName }) {
  const property = getProperty({ model, propertyName })
  if (property.title) return property.title

  return splitCamelCase(propertyName)
    .map((part, i) => {
      if (i === 0) {
        // cap first word
        return part[0].toUpperCase() + part.slice(1)
      }

      return part.toLowerCase()
    })
    .join(' ')
}

function isEnum (model) {
  return model.subClassOf === 'tradle.Enum'
}

function parseEnumValue ({ model, value }) {
  if (typeof value === 'object') value = value.id

  const id = value.slice(model.id.length + 1)
  return model.enum.find(val => val.id === id)
}

function isInstantiable (model) {
  const { id, isInterface, abstract, subClassOf } = model
  if (id === 'tradle.Model' || isInterface || abstract || subClassOf === 'tradle.Enum') {
    return false
  }

  return true
}

function isDescendantOf ({ models, a, b }) {
  let subClass
  let superClass = models[b]
  while ((subClass = models[a])) {
    if (!subClass) {
      throw new Error(`missing model: ${a}`)
    }

    if (!subClass.subClassOf) {
      return false
    }

    if (subClass.subClassOf === superClass.id) {
      return true
    }

    a = subClass.subClassOf
  }
}

function getInvalidPropertyValue (obj) {
  let invalid
  traverse(obj).forEach(function (value) {
    if (invalid) return

    if (isInvalidPropertyValue(value)) {
      if (value === undefined) {
        invalid = { value }
      } else if (value === '') {
        invalid = { value: '<empty string>' }
      }
    }

    if (invalid) {
      invalid.path = this.path.join('.')
      this.update(value, true) // stop traversing
    }
  })

  return invalid
}

function sanitize (obj) {
  const sanitized = _.cloneDeep(obj)
  const removed = []
  const result = { sanitized, removed }
  traverse(sanitized).forEach(function (value) {
    if (isInvalidPropertyValue(value)) {
      removed.push({
        key: this.key,
        value,
        path: this.path.join('.')
      })

      this.remove()
    }
  })

  return result
}

function isInvalidPropertyValue (value) {
  return value === undefined || value === ''
}

function hasVirtualDeep (resource) {
  let has = false
  traverse(resource).forEach(function (value) {
    if (isVirtualNode(this)) {
      has = true
      this.update(value, false) // stop traversing
    }
  })

  return has
}

function isVirtualNode (node) {
  const parentNode = node.parent && node.parent.node
  if (parentNode && parentNode[SIG]) {
    const localVirtual = parentNode._virtual || []
    const virtualProps = BUILT_IN_VIRTUAL_PROPS.concat(localVirtual)
    return virtualProps.includes(node.key)
  }
}

function omitVirtualDeep (resource) {
  const paths = traverse(resource).reduce(function (acc, value) {
    if (this.circular) {
      throw new Error('circular references not allowed')
    }

    if (isVirtualNode(this)) {
      acc.push(this.path)
    }

    return acc
  }, [])

  const copy = _.cloneDeep(resource)
  paths.forEach(path => _.unset(copy, path))
  return copy
}
