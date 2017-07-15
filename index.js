const { TYPE } = require('./lib/constants')
exports = module.exports = validateResource
exports.resource = validateResource
exports.property = require('./lib/property')
const validateLocal = require('./lib/resource')
const validateRefs = require('./lib/refs')
const { assert, toModelsMap } = require('./lib/utils')

function validateResource ({ model, models, resource }) {
  assert(typeof resource[TYPE] === 'string', `expected "${TYPE}"`)
  models = toModelsMap(models)
  if (!model) {
    model = models[resource[TYPE]]
  }

  if (!model) {
    throw new Error(`model "${resource[TYPE]}" was not found`)
  }

  validateLocal.resource({ models, model, resource })
  validateRefs({ models, model, resource })
}
