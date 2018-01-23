const { TYPE } = require('@tradle/constants')
const utils = require('./lib/utils')
const validateLocal = require('./lib/resource')
const validateRefs = require('./lib/refs')
const { assert, toModelsMap } = utils

exports = module.exports = validateResource
exports.resource = validateResource
exports.property = require('./lib/property')
exports.utils = utils
exports.refs = validateRefs

function validateResource ({ model, models, resource, allowUnknown, ignoreReadOnly }) {
  assert(typeof resource[TYPE] === 'string', `expected "${TYPE}"`)
  models = toModelsMap(models)
  if (typeof model === 'string') {
    model = models[model]
  }

  if (!model) {
    model = models[resource[TYPE]]
  }

  if (!model) {
    throw new Error(`model "${resource[TYPE]}" was not found`)
  }

  validateLocal.resource({ models, model, resource, allowUnknown, ignoreReadOnly })
  validateRefs({ models, model, resource, allowUnknown })
}
