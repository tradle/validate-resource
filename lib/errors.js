
const ex = require('error-ex')
const _Required = ex('Required')
const _InvalidPropertyValue = ex('InvalidPropertyValue')
const _InvalidNestedPropertyValue = ex('InvalidNestedPropertyValue')
class Required extends _Required {
  constructor(properties, message='') {
    super(`missing required properties: [${[].concat(properties.join(','))}]: ${message}`)
    this.properties = [].concat(properties)
  }
}

class InvalidPropertyValue extends _InvalidPropertyValue {
  constructor(propertyName, message='') {
    super(`invalid value for property ${propertyName}: ${message}`)
    this.property = propertyName
  }
}

class InvalidNestedPropertyValue extends _InvalidPropertyValue {
  constructor(propertyPath, message='') {
    super(message)
    this.property = propertyPath
  }
}

module.exports = {
  Required,
  Immutable: ex('Immutable'),
  NoSuchProperty: ex('NoSuchProperty'),
  NoSuchModel: ex('NoSuchModel'),
  InvalidPropertyValue,
  InvalidNestedPropertyValue,
  NotInstantiable: ex('NotInstantiable'),
  InvalidInput: ex('InvalidInput')
}
