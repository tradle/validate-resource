const pick = require('lodash/pick')
const extend = require('lodash/extend')
const isEqual = require('lodash/isEqual')
const omit = require('lodash/omit')
const unset = require('lodash/unset')
const getValues = require('lodash/values')
const pickBy = require('lodash/pickBy')
const omitBy = require('lodash/omitBy')
const cloneDeep = require('lodash/cloneDeep')
const debug = require('debug')(require('../package.json').name)
const traverse = require('traverse')
const validateModels = require('@tradle/validate-model')
const { ObjectModel, StubModel } = validateModels
const MessageModel = require('@tradle/models').models['tradle.Message']
// const bareStubProps = StubModel.required.slice().sort(alphabetical)
const OBJECT_PROPS = Object.keys(ObjectModel.properties)
const MESSAGE_PROPS = Object.keys(MessageModel.properties).concat(OBJECT_PROPS)
const OBJECT_NON_VIRTUAL_UNDERSCORE_PROPS = OBJECT_PROPS.filter(p => {
  if (p[0] === '_') {
    const prop = ObjectModel.properties[p]
    return !prop.virtual
  }
})

const MESSAGE_NON_VIRTUAL_UNDERSCORE_PROPS = MESSAGE_PROPS.filter(p => {
  if (p[0] === '_') {
    const prop = MessageModel.properties[p] || ObjectModel.properties[p]
    return !prop.virtual
  }
})

const NON_VIRTUAL_WHEN_NESTED = ['_link', '_permalink', '_displayName']

const {
  normalizeError,
  updateErrorWithMessage,
  stubProps,
  isInlinedProperty,
  isEnumProperty,
  isBacklinkProperty,
  isProtocolProperty,
  isEmailProperty,
  isComplexProperty,
  isPrimitiveProperty,
  getRef,
  isEnum,
  getPropertyTitle,
  getStubProperties,
  getEnumProperties,
  getPrimaryKeyProperties,
  getInlinedModel,
  isDescendantOf,
  getProperty,
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
const BUILT_IN_VIRTUAL_PROPS = Object.keys(ObjectModel.properties)
  .filter(key => key === '_virtual' || ObjectModel.properties[key].virtual)

const bareStubProps = stubProps

module.exports = {
  debug,
  parseId,
  parseStub,
  assert,
  assertValidValue,
  assertValidPropertyValue,
  validateEmail,
  normalizeError,
  updateErrorWithMessage,
  isProtocolProperty,
  isInlinedProperty,
  isEmailProperty,
  isEnumProperty,
  isComplexProperty,
  isPrimitiveProperty,
  isBacklinkProperty,
  isVirtualProperty,
  isVirtualPropertyName,
  toModelsMap,
  getRef,
  hasVirtualDeep,
  omitVirtualDeep,
  omitVirtualDeep1: omitVirtualDeepDumb,
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
  sanitize,
  stubProps,
  bareStubProps,
  getResourceIdentifier,
  getPermId,
  parsePermId,
  omitBacklinks,
  pickBacklinks,
  getPrimaryKeys,
  getPrimaryKeyProperties,
  getEnumProperties,
  getStubProperties
}

function parseId (id) {
  debugger
  console.warn('DEPRECATED METHOD: parseId')
  const [type, permalink, link] = id.split('_')
  return { type, permalink, link }
}

function parseStub (stub) {
  const { id, title, type, link, permalink, _t, _link, _permalink } = stub
  if (type && link && permalink) {
    return pick(stub, ['type', 'link', 'permalink', 'title'])
  }

  if (_t && _link && _permalink) {
    return { type: _t, link: _link, permalink: _permalink }
  }

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


function validateEmail({model, propertyName, value}) {
  let property = getProperty({model, propertyName})
  let pattern = property.pattern || "^(([^<>()\\[\\]\\\\.,;:\\s@\"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@\"]+)*)|(\".+\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$"
  if (!(new RegExp(pattern).test(value)))
    throw new Errors.InvalidPropertyValue(propertyName)
}

function toModelsMap (arr) {
  if (!Array.isArray(arr)) return arr

  const obj = {}
  for (let model of arr) {
    obj[model.id] = model
  }

  return obj
}

function isVirtualProperty ({ model, propertyName }) {
  if (isVirtualPropertyName(propertyName, model.id)) return true

  const property = model.properties[propertyName]
  return property.virtual
}

function isVirtualPropertyName (propertyName, type) {
  const REAL = type === MESSAGE ? MESSAGE_NON_VIRTUAL_UNDERSCORE_PROPS : OBJECT_NON_VIRTUAL_UNDERSCORE_PROPS
  return propertyName[0] === '_' && !REAL.includes(propertyName)
}

function isVirtualPropertyNameOfMessage (propertyName) {
  return propertyName[0] === '_' && !MESSAGE_NON_VIRTUAL_UNDERSCORE_PROPS.includes(propertyName)
}

function omitVirtual (object, props) {
  const type = object[TYPE]
  const real = omitBy(object, (value, key) => {
    if (isVirtualPropertyName(key, type)) {
      return !props || props.includes(key)
    }
  })

  if (object[TYPE] === MESSAGE && real.object) {
    real.object = omitVirtual(real.object)
  }

  return real
}

function stripVirtual (object) {
  Object.keys(object).filter(isVirtualPropertyName).forEach(key => {
    delete object[key]
  })

  return object
}

function pickVirtual (object, props) {
  return props ? pick(object, props.filter(isVirtualPropertyName)) : pickBy(object, (value, key) => isVirtualPropertyName(key))
}

function setVirtual (object, props) {
  Object.keys(props).every(p => {
    if (!isVirtualPropertyName(p)) {
      throw new Errors.InvalidInput(`expected virtual property: ${p}`)
    }
  })

  return extend(object, props)
}

function forEachNonVirtual (resource, fn) {
  return Object
    .keys(omitVirtual(resource))
    .forEach(fn)
}

function parseEnumValue ({ model, value }) {
  if (typeof value === 'object') value = value.id

  const id = value.startsWith(model.id) ? value.slice(model.id.length + 1) : value
  return model.enum.find(val => val.id === id)
}

function isInstantiable (model) {
  const { id, isInterface, abstract, subClassOf } = model
  if (id === 'tradle.Model' || isInterface || abstract || subClassOf === 'tradle.Enum') {
    return false
  }

  return true
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
  const sanitized = cloneDeep(obj)
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


function hasVirtualDeep ({ models, resource }) {
  return !isEqual(omitVirtualDeep({ models, resource }), resource)
}

// function hasVirtualDeep (resource) {
//   let has = false
//   traverse(resource).forEach(function (value) {
//     if (this.key && isVirtualPropertyName(this.key)) {
//       has = true
//       this.update(value, false) // stop traversing
//     }
//   })

//   return has
// }

// function isVirtualNode (node) {
//   const parentNode = node.parent && node.parent.node
//   if (parentNode && parentNode[SIG]) {
//     const localVirtual = parentNode._virtual || []
//     const virtualProps = BUILT_IN_VIRTUAL_PROPS.concat(localVirtual)
//     return virtualProps.includes(node.key)
//   }
// }

function getBareStub (stub) {
  return pick(stub, bareStubProps)
}

function omitVirtualDeep ({ models, model, resource }) {
  resource = omitVirtual(resource)

  const type = resource[TYPE]
  if (!model && models) model = models[type]

  if (!model) {
    debugger
    console.warn(`missing model: ${type}`)
    return omitVirtualDeepDumb(resource)
    // throw new Errors.InvalidInput(`model not found: ${type}`)
  }

  const { properties } = model
  for (let key in resource) {
    let property = properties[key]
    if (!property) continue
    if (property.range === 'json') continue
    if (!isComplexProperty(property)) continue
    if (isEnumProperty({ models, property })) continue

    let val = resource[key]
    if (isInlinedProperty({ models, property })) {
      let inlinedModel = getInlinedModel({ models, property })
      if (!inlinedModel) continue
      if (property.type === 'array') {
        resource[key] = val.map(subVal => omitVirtualDeep({ models, model: inlinedModel, resource: subVal }))
      } else {
        resource[key] = omitVirtualDeep({ models, model: inlinedModel, resource: val })
      }
    } else if (property.type === 'object') {
      resource[key] = getBareStub(val)
    } else if (property.type === 'array') {
      resource[key] = val.map(getBareStub)
    }
  }

  return resource
}

function isVirtualPropertyPath (path) {
  if (path.length === 1) return isVirtualPropertyName(path[0])

  const name = path[path.length - 1]
  if (NON_VIRTUAL_WHEN_NESTED.includes(name)) return false

  return isVirtualPropertyName(name)
}

function omitVirtualDeepDumb (resource) {
  const paths = traverse(resource).reduce(function (acc, value) {
    if (this.circular) {
      throw new Error('circular references not allowed')
    }

    if (this.key && isVirtualPropertyPath(this.path)) {
      acc.push(this.path)
    }

    return acc
  }, [])

  const copy = cloneDeep(resource)
  paths.forEach(path => unset(copy, path))
  return copy
}

function getResourceIdentifier (props) {
  const parts = _getResourceIdentifier(props)
  const { type, permalink } = parts
  if (!(type && permalink)) {
    throw new Errors.InvalidInput('not enough data to look up resource')
  }

  return parts
}

function _getResourceIdentifier (props) {
  if (TYPE in props) {
    return {
      type: props[TYPE],
      permalink: props._permalink,
      link: props._link
    }
  }

  const { type, permalink, link, id } = props
  if (id) return parseId(id)

  return { type, permalink, link }
}

function getPermId (opts) {
  const { type, permalink } = getResourceIdentifier(opts)
  return `${type}_${permalink}`
}

function parsePermId (permId) {
  const idx = permId.lastIndexOf('_')
  if (idx === -1) throw new Errors.InvalidInput('expected permId')

  return {
    type: permId.slice(0, idx),
    permalink: permId.slice(idx + 1)
  }
}

function omitBacklinks ({ model, resource }) {
  const { properties } = model
  return omitBy(resource, (value, propertyName) => isBacklinkProperty(properties[propertyName]))
}

function pickBacklinks ({ model, resource }) {
  const { properties } = model
  return pickBy(resource, (value, propertyName) => isBacklinkProperty(properties[propertyName]))
}

function getPrimaryKeys ({ model, resource }) {
  return pick(resource, getPrimaryKeyProperties(model))
}
