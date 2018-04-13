const pick = require('lodash/pick')
const { TYPE } = require('@tradle/constants')
const ObjectModel = require('./object-model')
const REQUIRED = [TYPE, '_link', '_permalink']

module.exports = {
  properties: pick(ObjectModel, REQUIRED),
  required: REQUIRED
}
