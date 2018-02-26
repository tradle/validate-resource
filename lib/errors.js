
const ex = require('error-ex')

module.exports = {
  Required: ex('Required'),
  Immutable: ex('Immutable'),
  NoSuchProperty: ex('NoSuchProperty'),
  NoSuchModel: ex('NoSuchModel'),
  InvalidValue: ex('InvalidValue'),
  NotInstantiable: ex('NotInstantiable'),
}
