const { TYPE } = require('@tradle/constants')
const utils = require('./lib/utils')
const validateLocal = require('./lib/resource')
const validateRefs = require('./lib/refs')
const { assertValidPropertyValue, toModelsMap } = utils
const Errors = require('./lib/errors')

exports = module.exports = validateResource
exports.resource = validateResource
exports.property = require('./lib/property')
exports.utils = utils
exports.refs = validateRefs
exports.Errors = Errors

function validateResource ({ model, models, resource, allowUnknown, partial }) {
  assertValidPropertyValue(TYPE, typeof resource[TYPE] === 'string', `expected string "${TYPE}"`)
  models = toModelsMap(models)
  if (typeof model === 'string') {
    model = models[model]
  }

  if (!model) {
    model = models[resource[TYPE]]
  }

  if (!model) {
    throw new Errors.NoSuchModel(`model "${resource[TYPE]}" was not found`)
  }

  validateLocal.resource({ models, model, resource, allowUnknown, partial })
  validateRefs({ models, model, resource, allowUnknown })
}
