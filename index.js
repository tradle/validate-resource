const { TYPE } = require('./lib/constants')
exports = module.exports = validateResource
exports.resource = validateResource
exports.property = require('./lib/property')
const standalone = require('./lib/resource')
const validateRefs = require('./lib/refs')
const { assert } = require('./lib/utils')

function validateResource ({ model, models, resource }) {
  assert(typeof resource[TYPE] === 'string', `expected "${TYPE}"`)
  if (!model) {
    model = models.find(m => m.id === resource[TYPE])
  }

  if (!model) {
    throw new Error(`model "${resource[TYPE]}" was not found`)
  }

  standalone.resource({ resource, model })
  validateRefs({ resource, model, models })
}
